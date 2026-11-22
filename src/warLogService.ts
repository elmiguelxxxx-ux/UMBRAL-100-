import { supabase, isSupabaseConfigured } from './supabase'
import { WarLogEntry } from './types'
import { TEST_USER_ID } from './noteService'

export async function fetchWarLog(userId: string = TEST_USER_ID): Promise<WarLogEntry[]> {
  if (!isSupabaseConfigured) return []
  const { data, error } = await supabase
    .from('war_log')
    .select('*')
    .eq('user_id', userId)
    .order('fecha', { ascending: false })

  if (error) {
    console.warn('[Supabase] Error al cargar war log:', error.message)
    return []
  }

  return (data || []).map((row: any) => ({
    id: row.id,
    date: row.fecha,
    victory: row.victory ?? true,
    focusMinutes: row.focus_minutes || 0,
    reflection: row.descripcion || '',
    excuseDefeated: row.excuse_defeated || '',
    completedHabits: row.completed_habits || [],
    createdAt: new Date(row.created_at).getTime(),
  }))
}

export async function saveWarLogToSupabase(entry: WarLogEntry, userId: string = TEST_USER_ID) {
  if (!isSupabaseConfigured) return
  const { error } = await supabase.from('war_log').upsert({
    id: entry.id,
    user_id: userId,
    titulo: entry.reflection.slice(0, 50) || 'Sesión de Foco',
    descripcion: entry.reflection,
    fecha: entry.date,
    focus_minutes: entry.focusMinutes,
    victory: entry.victory,
    excuse_defeated: entry.excuseDefeated,
    completed_habits: entry.completedHabits,
  })
  if (error) console.warn('[Supabase] Error al guardar war log:', error.message)
}