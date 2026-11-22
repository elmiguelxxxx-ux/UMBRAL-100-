import { supabase, isSupabaseConfigured } from './supabase'
import { Flashcard } from './types'
import { TEST_USER_ID } from './noteService'

export async function fetchFlashcards(userId: string = TEST_USER_ID): Promise<Flashcard[]> {
  if (!isSupabaseConfigured) return []
  const { data, error } = await supabase
    .from('flashcards')
    .select('*')
    .eq('user_id', userId)

  if (error) {
    console.warn('[Supabase] Error al cargar flashcards:', error.message)
    return []
  }

  return (data || []).map((row: any) => ({
    id: row.id,
    deckId: row.categoria || 'root',
    front: row.pregunta,
    back: row.respuesta,
    state: row.state || 0,
    stability: row.stability || 1.0,
    difficulty: row.difficulty || 5.0,
    due: row.due ? new Date(row.due).getTime() : Date.now(),
    reps: row.reps || 0,
    lapses: row.lapses || 0,
    createdAt: new Date(row.created_at).getTime(),
  }))
}

export async function saveFlashcardToSupabase(card: Flashcard, userId: string = TEST_USER_ID) {
  if (!isSupabaseConfigured) return
  const { error } = await supabase.from('flashcards').upsert({
    id: card.id,
    user_id: userId,
    pregunta: card.front,
    respuesta: card.back,
    categoria: card.deckId,
    state: card.state,
    stability: card.stability,
    difficulty: card.difficulty,
  })
  if (error) console.warn('[Supabase] Error al guardar flashcard:', error.message)
}

export async function deleteFlashcardFromSupabase(cardId: string) {
  if (!isSupabaseConfigured) return
  const { error } = await supabase.from('flashcards').delete().eq('id', cardId)
  if (error) console.warn('[Supabase] Error al eliminar flashcard:', error.message)
}