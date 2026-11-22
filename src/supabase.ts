import { createClient } from '@supabase/supabase-js'

const rawUrl = (import.meta.env.VITE_SUPABASE_URL || '').toString().trim()
const rawKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').toString().trim()

const isHttpUrl = (str: string): boolean => {
  if (!str) return false
  try {
    const parsed = new URL(str)
    return parsed.protocol === 'http:' || parsed.protocol === 'https:'
  } catch {
    return false
  }
}

let supabaseUrl = 'https://placeholder.supabase.co'
let supabaseAnonKey = 'placeholder-anon-key'

// Detect if user swapped VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
if (isHttpUrl(rawUrl)) {
  supabaseUrl = rawUrl
  if (rawKey) supabaseAnonKey = rawKey
} else if (isHttpUrl(rawKey)) {
  // Swapped: rawKey contains the valid URL, rawUrl contains the key
  supabaseUrl = rawKey
  if (rawUrl) supabaseAnonKey = rawUrl
} else if (rawUrl.includes('.supabase.co')) {
  supabaseUrl = `https://${rawUrl.replace(/^https?:\/\//, '')}`
  if (rawKey) supabaseAnonKey = rawKey
} else if (rawKey.includes('.supabase.co')) {
  supabaseUrl = `https://${rawKey.replace(/^https?:\/\//, '')}`
  if (rawUrl) supabaseAnonKey = rawUrl
}

// Final sanity check to guarantee a valid HTTP/HTTPS URL
if (!isHttpUrl(supabaseUrl)) {
  supabaseUrl = 'https://placeholder.supabase.co'
}
if (!supabaseAnonKey) {
  supabaseAnonKey = 'placeholder-anon-key'
}

let clientInstance: ReturnType<typeof createClient>
try {
  clientInstance = createClient(supabaseUrl, supabaseAnonKey)
} catch (err) {
  console.warn('Error inicializando Supabase client, usando placeholder:', err)
  clientInstance = createClient('https://placeholder.supabase.co', 'placeholder-anon-key')
}

export const supabase: any = clientInstance
export const isSupabaseConfigured =
  supabaseUrl !== 'https://placeholder.supabase.co' && supabaseAnonKey !== 'placeholder-anon-key'

