import { supabase, isSupabaseConfigured } from './supabase'

// ID de usuario fijo temporal, hasta que Umbral tenga login real.
export const APP_USER_ID = '00000000-0000-0000-0000-000000000001'

/**
 * Guarda el AppData completo como un solo bloque JSON en Supabase.
 * Operación 100% segura: si Supabase no está configurado (variables de entorno ausentes),
 * la función retorna inmediatamente sin emitir peticiones de red fallidas.
 */
export async function saveAppState(data: unknown, userId: string = APP_USER_ID): Promise<boolean> {
  if (!isSupabaseConfigured) {
    return false
  }

  try {
    const { error } = await supabase
      .from('app_state')
      .upsert({ user_id: userId, data, updated_at: new Date().toISOString() })

    if (error) {
      console.warn('[Sync] Advertencia al sincronizar con Supabase:', error.message)
      return false
    }
    return true
  } catch (err: any) {
    console.warn('[Sync] Excepción al sincronizar con Supabase:', err?.message || err)
    return false
  }
}

/**
 * Carga el último AppData guardado en Supabase para este usuario.
 * Devuelve null si no está configurado, si no hay datos o si ocurre un fallo.
 */
export async function loadAppState(userId: string = APP_USER_ID): Promise<any | null> {
  if (!isSupabaseConfigured) {
    return null
  }

  try {
    const { data, error } = await supabase
      .from('app_state')
      .select('data')
      .eq('user_id', userId)
      .maybeSingle()

    if (error) {
      console.warn('[Sync] Advertencia al cargar desde Supabase:', error.message)
      return null
    }
    return data?.data ?? null
  } catch (err: any) {
    console.warn('[Sync] Excepción al cargar desde Supabase:', err?.message || err)
    return null
  }
}
