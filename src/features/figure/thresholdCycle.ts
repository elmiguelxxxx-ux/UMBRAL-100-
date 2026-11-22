/**
 * thresholdCycle.ts
 * Cierra el ciclo Umbral → Misión → Evidencia → Nuevo umbral (Parte 4 del prompt).
 *
 * Reglas:
 *  - 'achieved' SOLO si verdict === 'logrado' Y helpUsed === 0.
 *  - Logrado CON ayuda cuenta como parcial: el umbral se mantiene y la próxima misión es de refuerzo.
 *  - Parcial / no logrado: el umbral pasa a 'replaced' y se crea uno MÁS PEQUEÑO desde las lagunas.
 *  - 3 'no_logrado' seguidos sobre el mismo tema: cambia el tipo de misión
 *    (lectura → recall, construcción → práctica).
 */
import { supabase, isSupabaseConfigured } from '../../supabase';
import { APP_USER_ID } from '../../appStateSync';
import { THRESHOLDS_STORAGE_KEY, UmbralActiveThreshold } from '../useUmbralProgress';

export const NEXT_MISSION_HINT_KEY = 'umbral_next_mission_hint_v1';
export const PROGRESS_CHANGED_EVENT = 'umbral:progress-changed';

export type MissionHintType = 'refuerzo' | 'recall' | 'practica';
export interface NextMissionHint {
  objectiveId: string;
  type: MissionHintType;
}

export type CycleOutcome = 'achieved' | 'kept_with_help' | 'replaced';

const newId = () =>
  typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2);

export function readNextMissionHint(objectiveId: string): MissionHintType | null {
  try {
    const raw = localStorage.getItem(NEXT_MISSION_HINT_KEY);
    const hint: NextMissionHint | null = raw ? JSON.parse(raw) : null;
    return hint && hint.objectiveId === objectiveId ? hint.type : null;
  } catch {
    return null;
  }
}

export function clearNextMissionHint() {
  try { localStorage.removeItem(NEXT_MISSION_HINT_KEY); } catch {}
}

async function proposeNext(
  threshold: UmbralActiveThreshold,
  verdict: string,
  gaps: string[]
): Promise<{ text: string; subtopics: string[] }> {
  try {
    const res = await fetch('/api/next-threshold', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentThreshold: threshold.text, topic: threshold.topic, verdict, gaps }),
    });
    if (res.ok) {
      const data = await res.json();
      if (data?.text) return { text: String(data.text).slice(0, 110), subtopics: data.subtopics || [threshold.topic] };
    }
  } catch {}
  // Respaldo local: nunca bloquear al usuario
  const focus = (gaps[0] || threshold.topic || 'el concepto central').slice(0, 40);
  return verdict === 'logrado'
    ? { text: `Aplicar ${threshold.topic} a un caso concreto sin apuntes.`.slice(0, 110), subtopics: [threshold.topic] }
    : { text: `Explicar la definición central de ${focus} sin apuntes.`.slice(0, 110), subtopics: [focus] };
}

export async function applyVerdictToThreshold(params: {
  threshold: UmbralActiveThreshold;
  verdict: 'logrado' | 'parcial' | 'no_logrado';
  helpUsed: number;
  gaps: string[];
  lastMissionType?: string;
}): Promise<CycleOutcome> {
  const { threshold, verdict, helpUsed, gaps, lastMissionType } = params;

  // Lista local (fuente de respaldo y de lectura offline)
  let list: any[] = [];
  try {
    const raw = localStorage.getItem(THRESHOLDS_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    list = Array.isArray(parsed) ? parsed : [parsed];
  } catch {}

  const current = list.find((t) => t.id === threshold.id) || {
    id: threshold.id,
    user_id: APP_USER_ID,
    objective_id: threshold.objectiveId,
    topic: threshold.topic,
    subtopics: threshold.subtopics,
    text: threshold.text,
    verification: threshold.verification,
    status: 'active',
    created_at: new Date().toISOString(),
  };
  if (!list.includes(current)) list.push(current);

  const attempts = (Number(current.attempts) || 0) + 1;
  let failStreak = Number(current.fail_streak) || 0;
  const achieved = verdict === 'logrado' && helpUsed === 0;
  const keptWithHelp = verdict === 'logrado' && helpUsed > 0;

  let outcome: CycleOutcome;
  let hint: MissionHintType | null = null;
  let nextRecord: any = null;

  if (keptWithHelp) {
    // Cuenta como parcial: se mantiene el umbral, misión de refuerzo "repetir sin ayuda"
    outcome = 'kept_with_help';
    current.attempts = attempts;
    hint = 'refuerzo';
  } else {
    const next = await proposeNext(threshold, verdict, gaps);
    current.attempts = attempts;
    if (achieved) {
      outcome = 'achieved';
      current.status = 'achieved';
      current.achieved_at = new Date().toISOString();
      failStreak = 0;
    } else {
      outcome = 'replaced';
      current.status = 'replaced';
      if (verdict === 'no_logrado') failStreak += 1;
      hint = 'refuerzo';
      if (failStreak >= 3) {
        // Tres no logrados seguidos sobre el mismo tema: cambiar el tipo de misión
        if (lastMissionType === 'lectura') hint = 'recall';
        else if (lastMissionType === 'construccion') hint = 'practica';
        failStreak = 0;
      }
    }
    current.fail_streak = Number(current.fail_streak) || 0;
    nextRecord = {
      id: newId(),
      user_id: APP_USER_ID,
      objective_id: threshold.objectiveId,
      topic: threshold.topic,
      subtopics: next.subtopics,
      text: next.text,
      verification: threshold.verification || 'explicar',
      status: 'active',
      attempts: 0,
      fail_streak: failStreak,
      created_at: new Date().toISOString(),
    };
    list.push(nextRecord);
  }

  // 1. Local
  try { localStorage.setItem(THRESHOLDS_STORAGE_KEY, JSON.stringify(list)); } catch {}
  try {
    if (hint) {
      localStorage.setItem(NEXT_MISSION_HINT_KEY, JSON.stringify({ objectiveId: threshold.objectiveId, type: hint }));
    } else {
      clearNextMissionHint();
    }
  } catch {}

  // 2. Supabase (el índice único permite un solo 'active': primero cerrar, luego insertar)
  if (isSupabaseConfigured) {
    try {
      await supabase
        .from('thresholds')
        .update({
          status: current.status,
          attempts: current.attempts,
          fail_streak: failStreak,
          ...(current.achieved_at ? { achieved_at: current.achieved_at } : {}),
        })
        .eq('id', threshold.id);
      if (nextRecord) await supabase.from('thresholds').insert(nextRecord);
    } catch (err) {
      console.warn('[thresholdCycle] Error guardando en Supabase:', err);
    }
  }

  // 3. Avisar a la figura para que muestre el umbral nuevo sin recargar
  try { window.dispatchEvent(new Event(PROGRESS_CHANGED_EVENT)); } catch {}

  return outcome;
}
