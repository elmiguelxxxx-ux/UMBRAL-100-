import { useEffect, useRef } from 'react';
import { supabase } from './supabase';
import { APP_USER_ID } from './appStateSync';

export type ActivityResourceType = 'pdf' | 'flashcard_deck' | 'canvas';
export type ActivityStatus = 'in_progress' | 'completed';

export interface ActivityLogRecord {
  id: string;
  user_id: string;
  resource_type: ActivityResourceType;
  resource_id: string;
  resource_title: string;
  last_interacted_at: string;
  status: ActivityStatus;
  progress_pct: number;
}

const LOCAL_STORAGE_KEY = 'umbral_activity_log';

/**
 * Obtiene los registros de actividad guardados en localStorage como fallback
 */
function getLocalLogs(): ActivityLogRecord[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/**
 * Guarda registros en localStorage
 */
function saveLocalLogs(logs: ActivityLogRecord[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(logs.slice(0, 50)));
  } catch (err) {
    console.warn('Error saving activity log to localStorage', err);
  }
}

/**
 * Registra o actualiza (upsert) una actividad en Supabase y localmente.
 * El resource_title se copia automáticamente del título real del recurso (doc.title, deck.name, canvas.title).
 */
export async function upsertActivityLog({
  userId = APP_USER_ID,
  resourceType,
  resourceId,
  resourceTitle,
  status = 'in_progress',
  progressPct = 0,
}: {
  userId?: string;
  resourceType: ActivityResourceType;
  resourceId: string;
  resourceTitle: string;
  status?: ActivityStatus;
  progressPct?: number;
}): Promise<ActivityLogRecord> {
  const safeTitle = (resourceTitle || 'Recurso sin título').trim();
  const id = `${userId}:${resourceType}:${resourceId}`;
  const nowIso = new Date().toISOString();

  const record: ActivityLogRecord = {
    id,
    user_id: userId,
    resource_type: resourceType,
    resource_id: resourceId,
    resource_title: safeTitle,
    last_interacted_at: nowIso,
    status,
    progress_pct: Math.min(100, Math.max(0, Math.round(progressPct))),
  };

  // 1. Guardar de inmediato en localStorage (resiliencia instantánea)
  const currentLogs = getLocalLogs().filter((item) => item.id !== id);
  currentLogs.unshift(record);
  saveLocalLogs(currentLogs);

  // 2. Upsert asíncrono en Supabase
  try {
    const { error } = await supabase.from('activity_log').upsert({
      id: record.id,
      user_id: record.user_id,
      resource_type: record.resource_type,
      resource_id: record.resource_id,
      resource_title: record.resource_title,
      last_interacted_at: record.last_interacted_at,
      status: record.status,
      progress_pct: record.progress_pct,
    });

    if (error) {
      // Si la tabla aún no existe en Supabase o credenciales son demo, advertir sin romper la UI
      console.warn('Aviso Supabase activity_log (usando respaldo local):', error.message);
    }
  } catch (err) {
    console.warn('Excepción al conectar con Supabase activity_log:', err);
  }

  return record;
}

/**
 * Consulta la actividad 'in_progress' más reciente para el usuario.
 * Ejecuta la query en Supabase: status='in_progress' y last_interacted_at desc limit 1.
 * Si falla o no hay datos remotos, recurre al log local.
 */
export async function getLatestInProgressActivity(
  userId: string = APP_USER_ID
): Promise<ActivityLogRecord | null> {
  try {
    const { data, error } = await supabase
      .from('activity_log')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'in_progress')
      .order('last_interacted_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!error && data) {
      const record: ActivityLogRecord = {
        id: data.id,
        user_id: data.user_id,
        resource_type: data.resource_type,
        resource_id: data.resource_id,
        resource_title: data.resource_title,
        last_interacted_at: data.last_interacted_at,
        status: data.status,
        progress_pct: Number(data.progress_pct || 0),
      };

      // Refrescar caché local
      const current = getLocalLogs().filter((l) => l.id !== record.id);
      current.unshift(record);
      saveLocalLogs(current);

      return record;
    }
  } catch (err) {
    console.warn('No se pudo consultar Supabase para el Centro de Misión, recurriendo a local:', err);
  }

  // Fallback desde localStorage
  const localItems = getLocalLogs().filter(
    (item) => item.user_id === userId && item.status === 'in_progress'
  );
  if (localItems.length > 0) {
    localItems.sort(
      (a, b) => new Date(b.last_interacted_at).getTime() - new Date(a.last_interacted_at).getTime()
    );
    return localItems[0];
  }

  return null;
}

/**
 * Hook automático para cada módulo (visor de PDF, sesión de flashcards, Canvas).
 * Ejecuta upsert en activity_log cada vez que el usuario abre o modifica ese recurso.
 * El resource_title se copia automáticamente del título real del recurso (doc.title, deck.name, canvas.title).
 */
export function useActivityTracker({
  resourceType,
  resourceId,
  resourceTitle,
  status = 'in_progress',
  progressPct = 0,
  enabled = true,
  dependencyKey,
}: {
  resourceType: ActivityResourceType;
  resourceId?: string | null;
  resourceTitle?: string | null;
  status?: ActivityStatus;
  progressPct?: number;
  enabled?: boolean;
  dependencyKey?: any; // Dispara actualización adicional cuando el recurso es modificado
}) {
  const lastLoggedRef = useRef<string>('');

  useEffect(() => {
    if (!enabled || !resourceId || !resourceTitle) return;

    const signature = `${resourceType}:${resourceId}:${resourceTitle}:${status}:${Math.round(progressPct)}:${dependencyKey ?? ''}`;
    // Evitar llamadas duplicadas consecutivas idénticas en el mismo ciclo
    if (lastLoggedRef.current === signature) return;
    lastLoggedRef.current = signature;

    const timer = setTimeout(() => {
      upsertActivityLog({
        userId: APP_USER_ID,
        resourceType,
        resourceId,
        resourceTitle,
        status,
        progressPct,
      });
    }, 200);

    return () => clearTimeout(timer);
  }, [resourceType, resourceId, resourceTitle, status, progressPct, enabled, dependencyKey]);
}
