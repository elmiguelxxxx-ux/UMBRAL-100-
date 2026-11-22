import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase, isSupabaseConfigured } from '../../supabase';
import { APP_USER_ID } from '../../appStateSync';
import { getUmbralDay } from '../../lib/umbralDay';
import { useUmbralProgress, UmbralActiveObjective, UmbralActiveThreshold } from '../useUmbralProgress';
import { queryGemini, readMissionHelpUsed } from '../../lib/aiClient';
import { useData } from '../../context/DataContext';
import { readNextMissionHint, clearNextMissionHint } from './thresholdCycle';

export interface MissionRecord {
  id: string;
  userId: string;
  objectiveId: string;
  thresholdId?: string;
  day: string;
  type: 'construccion' | 'lectura' | 'recall' | 'practica' | 'refuerzo';
  tool: 'canvas' | 'pdf' | 'aprendizaje' | 'examen';
  title: string;
  checklist: string[];
  estimatedMinutes: number;
  resourceId?: string;
  status: 'planned' | 'in_progress' | 'pending_evidence' | 'completed' | 'abandoned';
  startedAt?: number;
  endedAt?: number;
  helpUsed?: number;
}

const LOCAL_MISSION_KEY = 'umbral_active_mission_v2';
const SACRIFICE_CHECKS_KEY = 'umbral_sacrifice_checks_v1';

export function useMission(objective: UmbralActiveObjective | null, threshold: UmbralActiveThreshold | null) {
  const [mission, setMission] = useState<MissionRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const today = getUmbralDay(new Date());
  const { data: appData } = useData();
  const docsRef = useRef<{ id: string; title: string }[]>([]);
  docsRef.current = (appData?.pdfs || []).map((d: any) => ({ id: d.id, title: d.title }));

  // Cargar o generar misión diaria
  const loadMission = useCallback(async () => {
    if (!objective) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    let loaded: MissionRecord | null = null;

    // 1. Probar Supabase
    if (isSupabaseConfigured) {
      try {
        const { data: rows } = await supabase
          .from('missions')
          .select('*')
          .eq('user_id', APP_USER_ID)
          .eq('objective_id', objective.id)
          .eq('day', today)
          .maybeSingle();

        if (rows) {
          loaded = {
            id: rows.id,
            userId: rows.user_id,
            objectiveId: rows.objective_id,
            thresholdId: rows.threshold_id,
            day: rows.day,
            type: rows.type,
            tool: rows.tool,
            title: rows.title,
            checklist: rows.checklist || [],
            estimatedMinutes: rows.estimated_minutes || 25,
            resourceId: rows.resource_id,
            status: rows.status,
            startedAt: rows.started_at ? new Date(rows.started_at).getTime() : undefined,
            endedAt: rows.ended_at ? new Date(rows.ended_at).getTime() : undefined,
          };
        }
      } catch (err) {
        console.warn('[useMission] Supabase error:', err);
      }
    }

    // 2. Probar LocalStorage
    if (!loaded) {
      try {
        const raw = localStorage.getItem(`${LOCAL_MISSION_KEY}_${objective.id}_${today}`);
        if (raw) {
          loaded = JSON.parse(raw);
        }
      } catch {}
    }

    // 3. Si no existe, solicitar generación a /api/generate-mission o plantilla
    if (!loaded) {
      const topic = threshold?.topic || 'Conceptos clave';
      try {
        const res = await fetch('/api/generate-mission', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            objective: objective.title,
            // El servidor lee `activeThreshold` (antes se mandaba `threshold` y se ignoraba)
            activeThreshold: {
              text: threshold?.text || `Explicar ${topic} sin consultar apuntes`,
              topic,
              subtopics: threshold?.subtopics || [],
            },
            remainingDays: objective.remainingDays,
            dueCardsCount: 0,
            recentMissions: [],
            // Antes iba siempre vacío → toda misión salía como "Sube el material".
            availableDocs: docsRef.current,
            preferredType: readNextMissionHint(objective.id) || undefined,
          }),
        });

        if (res.ok) {
          const generated = await res.json();
          loaded = {
            id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2),
            userId: APP_USER_ID,
            objectiveId: objective.id,
            thresholdId: threshold?.id,
            day: today,
            type: generated.type || 'construccion',
            tool: generated.tool || 'canvas',
            title: generated.title || `Construir un mapa conceptual de ${topic}`,
            checklist: generated.checklist || [
              `Estructurar el núcleo de ${topic} en el lienzo`,
              'Conectar los conceptos clave sin consultar el material',
              'Validar la explicación con tus propias palabras',
            ],
            estimatedMinutes: generated.estimatedMinutes || 25,
            resourceId: generated.resourceId,
            status: 'planned',
          };
          clearNextMissionHint();
        }
      } catch (err) {
        // Fallback local garantizado
      }

      if (!loaded) {
        loaded = {
          id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2),
          userId: APP_USER_ID,
          objectiveId: objective.id,
          thresholdId: threshold?.id,
          day: today,
          type: 'construccion',
          tool: 'canvas',
          title: `Construir un mapa conceptual de ${topic}`,
          checklist: [
            `Estructurar el núcleo de ${topic} en el lienzo`,
            'Conectar los conceptos clave sin consultar el material',
            'Validar la explicación con tus propias palabras',
          ],
          estimatedMinutes: 25,
          status: 'planned',
        };
      }

      // Persistir
      try {
        localStorage.setItem(`${LOCAL_MISSION_KEY}_${objective.id}_${today}`, JSON.stringify(loaded));
      } catch {}

      if (isSupabaseConfigured) {
        try {
          await supabase.from('missions').upsert({
            id: loaded.id,
            user_id: loaded.userId,
            objective_id: loaded.objectiveId,
            threshold_id: loaded.thresholdId || null,
            day: loaded.day,
            type: loaded.type,
            tool: loaded.tool,
            title: loaded.title,
            checklist: loaded.checklist,
            estimated_minutes: loaded.estimatedMinutes,
            resource_id: loaded.resourceId || null,
            status: loaded.status,
          });
        } catch {}
      }
    }

    setMission(loaded);
    setIsLoading(false);
  }, [objective, threshold, today]);

  useEffect(() => {
    loadMission();
  }, [loadMission]);

  const updateMissionStatus = useCallback(
    async (
      status: 'planned' | 'in_progress' | 'pending_evidence' | 'completed' | 'abandoned',
      extra?: { startedAt?: number; endedAt?: number; helpUsed?: number }
    ) => {
      if (!mission) return;

      const updated: MissionRecord = {
        ...mission,
        status,
        ...(extra?.startedAt !== undefined ? { startedAt: extra.startedAt } : {}),
        ...(extra?.endedAt !== undefined ? { endedAt: extra.endedAt } : {}),
        // La ayuda gastada vive en localStorage (la suma aiClient); nunca se pisa con un valor viejo.
        helpUsed: Math.max(
          mission.helpUsed || 0,
          extra?.helpUsed ?? 0,
          readMissionHelpUsed(mission.objectiveId, mission.day)
        ),
      };

      setMission(updated);

      try {
        localStorage.setItem(`${LOCAL_MISSION_KEY}_${updated.objectiveId}_${updated.day}`, JSON.stringify(updated));
      } catch {}

      if (isSupabaseConfigured) {
        try {
          await supabase
            .from('missions')
            .update({
              status,
              ...(extra?.startedAt ? { started_at: new Date(extra.startedAt).toISOString() } : {}),
              ...(extra?.endedAt ? { ended_at: new Date(extra.endedAt).toISOString() } : {}),
            })
            .eq('id', updated.id);
        } catch (err) {
          console.warn('[useMission] Error actualizando status:', err);
        }
      }
    },
    [mission]
  );

  return {
    mission,
    isLoading,
    updateMissionStatus,
    reloadMission: loadMission,
  };
}

export function recordSacrificeCheck(objectiveId: string, day: string, kept: boolean): void {
  try {
    const raw = localStorage.getItem(SACRIFICE_CHECKS_KEY);
    const checks = raw ? JSON.parse(raw) : {};
    checks[`${objectiveId}_${day}`] = kept;
    localStorage.setItem(SACRIFICE_CHECKS_KEY, JSON.stringify(checks));
  } catch {}

  if (isSupabaseConfigured) {
    supabase
      .from('sacrifice_checks')
      .upsert({
        user_id: APP_USER_ID,
        objective_id: objectiveId,
        day,
        kept,
      })
      .then(() => {})
      .catch((err) => console.warn('[recordSacrificeCheck] error:', err));
  }
}

export function wasSacrificeChecked(objectiveId: string, day: string): boolean {
  try {
    const raw = localStorage.getItem(SACRIFICE_CHECKS_KEY);
    if (!raw) return false;
    const checks = JSON.parse(raw);
    return checks[`${objectiveId}_${day}`] !== undefined;
  } catch {
    return false;
  }
}
