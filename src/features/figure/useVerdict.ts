import { readMissionHelpUsed } from '../../lib/aiClient';
import { applyVerdictToThreshold } from './thresholdCycle';
import { useState, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../../supabase';
import { APP_USER_ID } from '../../appStateSync';
import { MissionRecord } from './useMission';
import { UmbralActiveThreshold } from '../useUmbralProgress';

export interface VerdictResult {
  verdict: 'logrado' | 'parcial' | 'no_logrado';
  gaps: string[];
  question?: string;
  source: 'ai' | 'self';
  helpUsed: number;
}

export function useVerdict() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<VerdictResult | null>(null);

  const evaluateEvidence = useCallback(
    async (params: {
      mission: MissionRecord;
      threshold: UmbralActiveThreshold;
      answer: string;
      docExcerpt?: string;
      aiEnabled: boolean;
      selfRubricAnswers?: boolean[];
    }): Promise<VerdictResult> => {
      setIsSubmitting(true);
      const { mission, threshold, answer, docExcerpt = '', aiEnabled } = params;
      const helpUsedNow = Math.max(mission.helpUsed || 0, readMissionHelpUsed(mission.objectiveId, mission.day));

      let verdictResult: VerdictResult;

      // 1. Si la IA está activa, consultar /api/evaluate-evidence
      if (aiEnabled) {
        try {
          const res = await fetch('/api/evaluate-evidence', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              threshold: threshold.text,
              subtopics: threshold.subtopics,
              answer,
              excerpt: docExcerpt,
            }),
          });

          if (res.ok) {
            const data = await res.json();
            verdictResult = {
              verdict: data.verdict || 'parcial',
              gaps: Array.isArray(data.gaps) ? data.gaps : [],
              question: data.question,
              source: 'ai',
              helpUsed: helpUsedNow,
            };
          } else {
            throw new Error('API error');
          }
        } catch {
          // Fallback a modo autoevaluación / cálculo local
          verdictResult = evaluateSelf(answer, threshold.subtopics, helpUsedNow);
        }
      } else {
        // 2. Modo Autoevaluación
        verdictResult = evaluateSelf(answer, threshold.subtopics, helpUsedNow, params.selfRubricAnswers);
      }

      setResult(verdictResult);

      // Guardar en mission_evidence
      const evidencePayload = {
        id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2),
        user_id: APP_USER_ID,
        mission_id: mission.id,
        answer,
        verdict: verdictResult.verdict,
        gaps: verdictResult.gaps,
        source: verdictResult.source,
        help_used: verdictResult.helpUsed,
        created_at: new Date().toISOString(),
      };

      try {
        const raw = localStorage.getItem('umbral_mission_evidences_v1');
        const list = raw ? JSON.parse(raw) : [];
        list.push(evidencePayload);
        localStorage.setItem('umbral_mission_evidences_v1', JSON.stringify(list));
      } catch {}

      if (isSupabaseConfigured) {
        try {
          await supabase.from('mission_evidence').upsert(evidencePayload);
        } catch (err) {
          console.warn('[useVerdict] Supabase save error:', err);
        }
      }

      // Cerrar el ciclo: logrado sin ayuda → siguiente umbral; resto → umbral más pequeño / refuerzo
      try {
        await applyVerdictToThreshold({
          threshold,
          verdict: verdictResult.verdict,
          helpUsed: verdictResult.helpUsed,
          gaps: verdictResult.gaps,
          lastMissionType: mission.type,
        });
      } catch (err) {
        console.warn('[useVerdict] No se pudo avanzar el umbral:', err);
      }

      setIsSubmitting(false);
      return verdictResult;
    },
    []
  );

  return {
    evaluateEvidence,
    isSubmitting,
    result,
  };
}

function evaluateSelf(
  answer: string,
  subtopics: string[],
  helpUsed: number,
  rubricAnswers?: boolean[]
): VerdictResult {
  if (rubricAnswers && rubricAnswers.length > 0) {
    const checked = rubricAnswers.filter(Boolean).length;
    const ratio = checked / rubricAnswers.length;

    if (ratio >= 0.85) {
      return {
        verdict: 'logrado',
        gaps: [],
        source: 'self',
        helpUsed,
      };
    } else if (ratio >= 0.5) {
      return {
        verdict: 'parcial',
        gaps: ['Algunos subtemas clave de la rúbrica quedaron sin cubrir con claridad'],
        question: '¿Qué aspecto de la rúbrica necesitó más precisión?',
        source: 'self',
        helpUsed,
      };
    } else {
      return {
        verdict: 'no_logrado',
        gaps: ['La mayoría de criterios de la rúbrica no fueron cubiertos'],
        question: '¿Qué concepto nuclear requiere un nuevo intento de reconstrucción?',
        source: 'self',
        helpUsed,
      };
    }
  }

  // Si no hay rúbrica detallada, estimar por longitud y coherencia del texto
  const len = answer.trim().length;
  if (len >= 250) {
    return {
      verdict: 'logrado',
      gaps: [],
      source: 'self',
      helpUsed,
    };
  } else if (len >= 80) {
    return {
      verdict: 'parcial',
      gaps: ['Explicación breve que requiere profundizar en conexiones clave'],
      question: '¿Cómo conectarías este concepto con tu práctica diaria?',
      source: 'self',
      helpUsed,
    };
  }

  return {
    verdict: 'no_logrado',
    gaps: ['Respuesta insuficiente'],
    question: '¿Puedes reconstruir la idea central sin notas?',
    source: 'self',
    helpUsed,
  };
}
