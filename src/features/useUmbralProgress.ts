import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase, isSupabaseConfigured } from '../supabase';
import { APP_USER_ID } from '../appStateSync';
import { getUmbralDay } from '../lib/umbralDay';
import { getLatestInProgressActivity } from '../activityLogService';

export interface UmbralActiveObjective {
  id: string;
  title: string;
  position: 1 | 2;
  startsAt: string;
  deadlineAt: string;
  deadlineDays: number;
  daysElapsed: number;
  remainingDays: number;
  dayLabel: string;
}

export interface UmbralActiveThreshold {
  id: string;
  objectiveId: string;
  topic: string;
  subtopics: string[];
  text: string;
  verification: 'explicar' | 'resolver' | 'aplicar';
}

export const THRESHOLDS_STORAGE_KEY = 'umbral_thresholds_v1';
export const DAILY_FOCUS_STORAGE_KEY = 'umbral_daily_focus_v1';

export function useUmbralProgress() {
  const [activeObjective, setActiveObjective] = useState<UmbralActiveObjective | null>(null);
  const [activeThreshold, setActiveThreshold] = useState<UmbralActiveThreshold | null>(null);
  const [allObjectives, setAllObjectives] = useState<UmbralActiveObjective[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const userIdRef = useRef<string>(APP_USER_ID);

  const loadProgress = useCallback(async () => {
    setIsLoading(true);
    const today = getUmbralDay(new Date());

    // 1. Obtener User ID
    try {
      if (isSupabaseConfigured) {
        const { data } = await supabase.auth.getUser();
        if (data?.user?.id) userIdRef.current = data.user.id;
      }
    } catch {}

    const uid = userIdRef.current;
    let fetchedObjectives: any[] = [];
    let fetchedThresholds: any[] = [];
    let focusObjectiveId: string | null = null;

    // 2. Cargar Objetivos (Supabase o LocalStorage)
    if (isSupabaseConfigured) {
      try {
        const { data: objRows } = await supabase
          .from('objectives')
          .select('*')
          .eq('user_id', uid)
          .eq('status', 'active')
          .order('position', { ascending: true });

        if (objRows && objRows.length > 0) {
          fetchedObjectives = objRows;
        }

        const { data: threshRows } = await supabase
          .from('thresholds')
          .select('*')
          .eq('user_id', uid)
          .eq('status', 'active');

        if (threshRows && threshRows.length > 0) {
          fetchedThresholds = threshRows;
        }

        const { data: focusRow } = await supabase
          .from('daily_focus')
          .select('objective_id')
          .eq('user_id', uid)
          .eq('day', today)
          .maybeSingle();

        if (focusRow?.objective_id) {
          focusObjectiveId = focusRow.objective_id;
        }
      } catch (err) {
        console.warn('[UmbralProgress] Error leyendo Supabase:', err);
      }
    }

    // Fallback a LocalStorage si Supabase no trajo objetivos
    if (fetchedObjectives.length === 0) {
      try {
        const rawOnboarding = localStorage.getItem('umbral_onboarding_v1');
        if (rawOnboarding) {
          const parsed = JSON.parse(rawOnboarding);
          if (Array.isArray(parsed.objectives)) {
            const now = new Date();
            // El inicio de cada objetivo se fija UNA sola vez y se guarda: antes se
            // recalculaba en cada carga y el plazo volvía siempre al día 1.
            let startsMap: Record<string, string> = {};
            try {
              startsMap = JSON.parse(localStorage.getItem('umbral_objective_starts_v1') || '{}');
            } catch {}
            let startsChanged = false;
            fetchedObjectives = parsed.objectives.map((o: any, idx: number) => {
              const days = o.deadlineDays || 30;
              const objId = o.id || `local-obj-${o.position || idx + 1}`;
              if (!startsMap[objId]) {
                startsMap[objId] = (o.startsAt || o.createdAt || now.toISOString()) as string;
                startsChanged = true;
              }
              const starts = new Date(startsMap[objId]);
              const deadline = new Date(starts.getTime() + days * 24 * 3600 * 1000);
              if (startsChanged) {
                try { localStorage.setItem('umbral_objective_starts_v1', JSON.stringify(startsMap)); } catch {}
              }
              return {
                id: objId,
                title: o.title,
                position: o.position || idx + 1,
                starts_at: starts.toISOString(),
                deadline_at: deadline.toISOString(),
                deadline_days: days,
              };
            });
          }
        }
      } catch {}
    }

    // Fallback a LocalStorage para thresholds
    if (fetchedThresholds.length === 0) {
      try {
        const rawThresh = localStorage.getItem(THRESHOLDS_STORAGE_KEY);
        if (rawThresh) {
          const parsed = JSON.parse(rawThresh);
          if (Array.isArray(parsed)) {
            fetchedThresholds = parsed.filter((t: any) => t.status === 'active');
          }
        }
      } catch {}
    }

    // Fallback a LocalStorage para daily_focus
    if (!focusObjectiveId) {
      try {
        const rawFocus = localStorage.getItem(DAILY_FOCUS_STORAGE_KEY);
        if (rawFocus) {
          const parsed = JSON.parse(rawFocus);
          if (parsed && parsed[today]) {
            focusObjectiveId = parsed[today];
          }
        }
      } catch {}
    }

    if (fetchedObjectives.length === 0) {
      setActiveObjective(null);
      setActiveThreshold(null);
      setIsLoading(false);
      return;
    }

    // Procesar objetivos con días transcurridos y restantes
    const now = new Date();
    const parsedObjectives: UmbralActiveObjective[] = fetchedObjectives.map((o: any) => {
      const starts = new Date(o.starts_at || now);
      const deadline = new Date(o.deadline_at || now.getTime() + (o.deadline_days || 30) * 86400000);
      const totalDays = o.deadline_days || 30;

      const elapsedMs = now.getTime() - starts.getTime();
      const daysElapsed = Math.max(1, Math.min(totalDays, Math.floor(elapsedMs / 86400000) + 1));

      const remainingMs = deadline.getTime() - now.getTime();
      const remainingDays = Math.max(0, Math.ceil(remainingMs / 86400000));

      const dayLabel = remainingDays <= 7
        ? remainingDays === 1
          ? 'Queda 1 día'
          : `Quedan ${remainingDays} días`
        : `Día ${daysElapsed} de ${totalDays}`;

      return {
        id: o.id,
        title: o.title,
        position: o.position === 2 ? 2 : 1,
        startsAt: starts.toISOString(),
        deadlineAt: deadline.toISOString(),
        deadlineDays: totalDays,
        daysElapsed,
        remainingDays,
        dayLabel,
      };
    });

    setAllObjectives(parsedObjectives);

    // Selección del objetivo del día:
    // 1) Si ya hay foco guardado para hoy, usar ese
    // 2) Si hay 1 solo, usar ese
    // 3) Si hay 2: el de menor días restantes; en empate, menor actividad reciente
    let chosen = parsedObjectives[0];

    if (focusObjectiveId) {
      const found = parsedObjectives.find((o) => o.id === focusObjectiveId);
      if (found) chosen = found;
    } else if (parsedObjectives.length > 1) {
      const [obj1, obj2] = parsedObjectives;
      if (obj1.remainingDays < obj2.remainingDays) {
        chosen = obj1;
      } else if (obj2.remainingDays < obj1.remainingDays) {
        chosen = obj2;
      } else {
        // En empate, evaluar actividad reciente
        try {
          const latestAct = await getLatestInProgressActivity(uid);
          if (latestAct && latestAct.resource_title && latestAct.resource_title.toLowerCase().includes(obj2.title.toLowerCase())) {
            chosen = obj1; // el de menor actividad
          } else {
            chosen = obj2;
          }
        } catch {
          chosen = obj1;
        }
      }

      // Guardar el objetivo fijado para hoy para que no cambie dentro del mismo día
      try {
        const rawFocus = localStorage.getItem(DAILY_FOCUS_STORAGE_KEY);
        const map = rawFocus ? JSON.parse(rawFocus) : {};
        map[today] = chosen.id;
        localStorage.setItem(DAILY_FOCUS_STORAGE_KEY, JSON.stringify(map));

        if (isSupabaseConfigured) {
          await supabase.from('daily_focus').upsert({
            user_id: uid,
            day: today,
            objective_id: chosen.id,
          });
        }
      } catch (err) {
        console.warn('[UmbralProgress] Error persistiendo daily_focus:', err);
      }
    }

    setActiveObjective(chosen);

    // Buscar umbral activo asociado a este objetivo (o el más reciente)
    const matchingThresh =
      fetchedThresholds.find((t: any) => t.objective_id === chosen.id && t.status === 'active') ||
      fetchedThresholds.find((t: any) => t.status === 'active');

    if (matchingThresh) {
      setActiveThreshold({
        id: matchingThresh.id,
        objectiveId: matchingThresh.objective_id || chosen.id,
        topic: matchingThresh.topic,
        subtopics: matchingThresh.subtopics || [],
        text: matchingThresh.text,
        verification: matchingThresh.verification || 'explicar',
      });
    } else {
      setActiveThreshold(null);
    }

    setIsLoading(false);
  }, []);

  useEffect(() => {
    loadProgress();
  }, [loadProgress]);

  // Cuando se cierra un ciclo (nuevo umbral), recargar sin pedir al usuario que refresque
  useEffect(() => {
    const onChange = () => { loadProgress(); };
    window.addEventListener('umbral:progress-changed', onChange);
    return () => window.removeEventListener('umbral:progress-changed', onChange);
  }, [loadProgress]);

  return {
    activeObjective,
    activeThreshold,
    allObjectives,
    hasActiveThreshold: Boolean(activeThreshold),
    isLoading,
    refresh: loadProgress,
  };
}
