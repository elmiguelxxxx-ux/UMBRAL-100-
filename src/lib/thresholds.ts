export interface DetectedTopicResult {
  topic: string;
  subtopics: string[];
  materialType: 'teoria' | 'practica' | 'mixto';
}

export type ThresholdVerificationType = 'explicar' | 'resolver' | 'aplicar';

export interface ThresholdOption {
  text: string;
  verification: ThresholdVerificationType;
}

export interface ProposeThresholdsResult {
  options: ThresholdOption[];
}

/**
 * Heurística local de respaldo para detección de tema si la red o IA falla.
 */
function localDetectFallback(text: string, _objectiveTitle: string): DetectedTopicResult {
  const lines = text
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 3 && !/^\d+$/.test(l));

  const candidateTopic = lines[0] ? lines[0].slice(0, 60).replace(/[#*_-]/g, '').trim() : 'Material de estudio';

  const subtopics: string[] = [];
  for (let i = 1; i < lines.length && subtopics.length < 4; i++) {
    const line = lines[i].replace(/[#*•·_-]/g, '').trim();
    if (line.length > 6 && line.length < 50 && !subtopics.includes(line)) {
      subtopics.push(line);
    }
  }

  return {
    topic: candidateTopic || 'Tema de estudio',
    subtopics: subtopics.length > 0 ? subtopics : ['Conceptos fundamentales', 'Principios clave'],
    materialType: 'mixto',
  };
}

/**
 * Plantillas locales de respaldo para proponer 3 umbrales verificables.
 */
export function getLocalThresholdOptions(topic: string): ThresholdOption[] {
  const cleanTopic = topic.trim() || 'el tema';
  return [
    {
      text: `Explicar ${cleanTopic} sin consultar apuntes.`.slice(0, 110),
      verification: 'explicar',
    },
    {
      text: `Resolver 10 preguntas sobre ${cleanTopic} sin abrir el documento.`.slice(0, 110),
      verification: 'resolver',
    },
    {
      text: `Aplicar los principios de ${cleanTopic} a un caso práctico sin ayuda externa.`.slice(0, 110),
      verification: 'aplicar',
    },
  ];
}

/**
 * Cliente para detectar tema desde endpoint backend con fallback silencioso a heurística.
 */
export async function detectTopicFromText(
  text: string,
  objectiveTitle: string
): Promise<DetectedTopicResult> {
  const snippet = text.slice(0, 6000);

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 9000);

    const res = await fetch('/api/detect-topic', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: snippet, objectiveTitle }),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (res.ok) {
      const data = await res.json();
      if (data && typeof data.topic === 'string' && data.topic.trim()) {
        const subtopics = Array.isArray(data.subtopics) ? data.subtopics.slice(0, 5) : [];
        const validTypes: Array<'teoria' | 'practica' | 'mixto'> = ['teoria', 'practica', 'mixto'];
        const materialType = validTypes.includes(data.materialType) ? data.materialType : 'mixto';

        return {
          topic: data.topic.trim().slice(0, 80),
          subtopics,
          materialType,
        };
      }
    }
  } catch (err) {
    console.warn('[Thresholds] Fallback silencioso en detección de tema:', err);
  }

  return localDetectFallback(text, objectiveTitle);
}

/**
 * Cliente para generar 3 opciones verificables de umbral con Gemini o plantillas.
 */
export async function proposeThresholds(params: {
  topic: string;
  subtopics: string[];
  materialType: 'teoria' | 'practica' | 'mixto';
  objective: string;
  remainingDays: number;
}): Promise<ProposeThresholdsResult> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 9000);

    const res = await fetch('/api/propose-thresholds', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (res.ok) {
      const data = await res.json();
      if (data && Array.isArray(data.options) && data.options.length >= 3) {
        const validOptions: ThresholdOption[] = data.options
          .slice(0, 3)
          .map((opt: any) => ({
            text: String(opt.text || '').trim().slice(0, 110),
            verification: (['explicar', 'resolver', 'aplicar'].includes(opt.verification)
              ? opt.verification
              : 'explicar') as ThresholdVerificationType,
          }))
          .filter((opt: ThresholdOption) => opt.text.length > 5);

        if (validOptions.length === 3) {
          return { options: validOptions };
        }
      }
    }
  } catch (err) {
    console.warn('[Thresholds] Fallback silencioso en propuesta de umbrales:', err);
  }

  return { options: getLocalThresholdOptions(params.topic) };
}
