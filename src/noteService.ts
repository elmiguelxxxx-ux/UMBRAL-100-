import { supabase, isSupabaseConfigured } from './supabase'

export const TEST_USER_ID = '00000000-0000-0000-0000-000000000001' // UUID válido de respaldo

export async function fetchNotas(userId: string = TEST_USER_ID) {
  if (!isSupabaseConfigured) return []
  const { data, error } = await supabase
    .from('notas')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })

  if (error) {
    console.warn('[Supabase] Error al cargar notas:', error.message)
    return []
  }
  return data || []
}

export async function saveNotaToSupabase(titulo: string, contenido: string, notaId?: string, userId: string = TEST_USER_ID) {
  if (!isSupabaseConfigured) return null
  try {
    if (notaId) {
      const { data, error } = await supabase
        .from('notas')
        .update({ titulo, contenido, updated_at: new Date().toISOString() })
        .eq('id', notaId)
        .eq('user_id', userId)
        .select()

      if (error) {
        console.warn('[Supabase] Error al actualizar nota:', error.message)
        return null
      }
      return data?.[0]
    } else {
      const { data, error } = await supabase
        .from('notas')
        .insert([{ user_id: userId, titulo, contenido }])
        .select()

      if (error) {
        console.warn('[Supabase] Error al crear nota:', error.message)
        return null
      }
      return data?.[0]
    }
  } catch (err) {
    console.warn('[Supabase] Excepción al guardar nota:', err)
    return null
  }
}