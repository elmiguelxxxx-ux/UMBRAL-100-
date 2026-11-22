/**
 * aiClient.ts
 * Canal unificado para toda interacción con Gemini en Umbral.
 * Si SettingsContext.aiEnabled === false, no hay clave o hay error,
 * aiClient lanza AiUnavailable para activar el respaldo local.
 */
import { AiUnavailable, AiHelpKind, AI_HELP_LIMIT_PER_MISSION } from './aiPolicy';
import { getUmbralDay } from './umbralDay';
import { supabase, isSupabaseConfigured } from '../supabase';
import { APP_USER_ID } from '../appStateSync';

export interface AiClientConfig {
  aiEnabled?: boolean;
  apiKey?: string;
  provider?: 'gemini' | 'groq';
}

function getStoredAiConfig(): AiClientConfig {
  try {
    const raw = localStorage.getItem('umbral-web-data-v2');
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        aiEnabled: parsed?.settings?.aiEnabled ?? true,
        apiKey: parsed?.settings?.geminiApiKey || '',
        provider: parsed?.settings?.aiProvider || 'gemini',
      };
    }
  } catch {}
  return { aiEnabled: true, apiKey: '', provider: 'gemini' };
}

/**
 * Registra un evento de ayuda de IA en Supabase / LocalStorage
 */
export async function trackAiHelpEvent(kind: AiHelpKind, missionId?: string): Promise<void> {
  const event = {
    id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2),
    user_id: APP_USER_ID,
    mission_id: missionId || null,
    kind,
    created_at: new Date().toISOString(),
  };

  try {
    const rawEvents = localStorage.getItem('umbral_ai_help_events_v1');
    const list = rawEvents ? JSON.parse(rawEvents) : [];
    list.push(event);
    localStorage.setItem('umbral_ai_help_events_v1', JSON.stringify(list));
  } catch {}

  if (isSupabaseConfigured) {
    try {
      await supabase.from('ai_help_events').insert(event);
    } catch (err) {
      console.warn('[trackAiHelpEvent] Supabase insert error:', err);
    }
  }
}


const MISSION_KEY_PREFIX = 'umbral_active_mission_v2_';

/** Misión en curso de hoy (guardada por useMission en localStorage), o null si no hay. */
function findActiveMissionKey(): { key: string; mission: any } | null {
  try {
    const today = getUmbralDay(new Date());
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key || !key.startsWith(MISSION_KEY_PREFIX)) continue;
      const mission = JSON.parse(localStorage.getItem(key) || 'null');
      if (mission && mission.day === today && mission.status === 'in_progress') {
        return { key, mission };
      }
    }
  } catch {}
  return null;
}

/** Ayudas ya gastadas en una misión (lee el valor guardado, no el estado de React). */
export function readMissionHelpUsed(objectiveId: string, day: string): number {
  try {
    const raw = localStorage.getItem(`${MISSION_KEY_PREFIX}${objectiveId}_${day}`);
    return raw ? Number(JSON.parse(raw)?.helpUsed) || 0 : 0;
  } catch {
    return 0;
  }
}

/**
 * Se llama ANTES de pedir una ayuda a la IA. 'interrogate' es gratis; 'hint' y 'review'
 * cuentan y están limitadas por misión. Si se agotó, lanza AiUnavailable y el llamador
 * usa su respaldo local (nunca se bloquea al usuario).
 */
export function assertAiHelpAvailable(kind: AiHelpKind): void {
  if (kind === 'interrogate') return;
  const active = findActiveMissionKey();
  if (active && (Number(active.mission.helpUsed) || 0) >= AI_HELP_LIMIT_PER_MISSION) {
    throw new AiUnavailable('Ya usaste la ayuda de IA de esta misión.');
  }
}

/** Se llama DESPUÉS de una ayuda exitosa: la cuenta en la misión y la registra con su id. */
async function registerAiHelp(kind: AiHelpKind): Promise<void> {
  const active = findActiveMissionKey();
  if (active && kind !== 'interrogate') {
    try {
      const updated = { ...active.mission, helpUsed: (Number(active.mission.helpUsed) || 0) + 1 };
      localStorage.setItem(active.key, JSON.stringify(updated));
    } catch {}
  }
  await trackAiHelpEvent(kind, active?.mission?.id);
}

/**
 * Consulta genérica a Gemini (texto o JSON) garantizando política de IA
 */
export async function queryGemini(prompt: string, options?: { json?: boolean }): Promise<string> {
  const config = getStoredAiConfig();

  if (config.aiEnabled === false) {
    throw new AiUnavailable('La IA está desactivada en Ajustes.');
  }

  try {
    // La clave del servidor nunca llega al navegador: /api/ai la usa si el usuario no trae la suya.
    const res = await fetch('/api/ai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, json: options?.json === true, apiKey: config.apiKey || undefined }),
    });
    if (res.status === 503) throw new Error('No hay clave de API configurada para Gemini.');
    if (!res.ok) throw new Error(`IA no disponible (${res.status})`);
    const data = await res.json();
    if (!data?.text) throw new Error('Respuesta vacía de Gemini');
    return String(data.text).trim();
  } catch (err: any) {
    throw new AiUnavailable(err?.message || 'Error de conexión con la IA');
  }
}

/**
 * Interrogador de estudio (lector): recibe "Mi explicación" y devuelve 1 a 3 preguntas
 */
export async function interrogateConcept(userExplanation: string, docExcerpt: string): Promise<string[]> {
  const prompt = `Eres el Interrogador socrático de Umbral.
Nunca expliques ni resumas el tema ni des la respuesta; solo formula preguntas que expongan lo que falta o pongan a prueba las suposiciones del estudiante.

Material de referencia:
"""
${docExcerpt.slice(0, 3000)}
"""

Explicación redactada por el estudiante:
"""
${userExplanation.slice(0, 2000)}
"""

Formula entre 1 y 3 preguntas incisivas y directas.
Responde ÚNICAMENTE en JSON válido con formato:
{ "questions": ["Pregunta 1", "Pregunta 2"] }`;

  try {
    const raw = await queryGemini(prompt, { json: true });
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed?.questions) && parsed.questions.length > 0) {
      await registerAiHelp('interrogate');
      return parsed.questions.slice(0, 3);
    }
  } catch (err) {
    if (err instanceof AiUnavailable) throw err;
  }

  throw new AiUnavailable('No se pudo generar el interrogatorio socrático');
}

/**
 * Revisar mi mapa conceptual (Canvas): detecta conexiones faltantes (máx. 2 preguntas)
 */
export async function reviewConceptMap(nodeTitles: string[], currentConnections: string[]): Promise<string[]> {
  const prompt = `Eres el evaluador de mapas de Umbral.
El estudiante construyó un mapa con estos conceptos:
${nodeTitles.join(', ')}

Conexiones actuales:
${currentConnections.join('; ') || 'Ninguna registrada'}

Formula MÁXIMO 2 PREGUNTAS sobre conexiones clave o jerarquías conceptuales que falten considerar.
NUNCA le digas la respuesta ni le digas qué conectar exactamente; solo cuestiona la relación entre conceptos.
Responde ÚNICAMENTE en JSON válido:
{ "questions": ["¿Cómo se relaciona X con Y?", "¿Por qué Z no influye en...?"] }`;

  assertAiHelpAvailable('review');
  const raw = await queryGemini(prompt, { json: true });
  const parsed = JSON.parse(raw);
  if (Array.isArray(parsed?.questions) && parsed.questions.length > 0) {
    await registerAiHelp('review');
    return parsed.questions.slice(0, 2);
  }

  throw new AiUnavailable('No se pudieron obtener preguntas de revisión para el mapa');
}

/**
 * Revisar mi tarjeta (Flashcard): valida si la respuesta es precisa o confusa
 */
export async function reviewFlashcard(front: string, back: string): Promise<string[]> {
  const prompt = `Eres el revisor de tarjetas de retención de Umbral.
Pregunta / Anverso: "${front}"
Respuesta / Reverso: "${back}"

Formula 1 sola pregunta que ayude al estudiante a ver si su respuesta es ambigua, circular o demasiado larga para recordar.
Nunca le des la respuesta correcta.
Responde ÚNICAMENTE en JSON válido:
{ "questions": ["¿Tu respuesta distingue claramente este concepto de...?"] }`;

  assertAiHelpAvailable('review');
  const raw = await queryGemini(prompt, { json: true });
  const parsed = JSON.parse(raw);
  if (Array.isArray(parsed?.questions) && parsed.questions.length > 0) {
    await registerAiHelp('review');
    return parsed.questions.slice(0, 1);
  }

  throw new AiUnavailable('No se pudo revisar la tarjeta');
}
