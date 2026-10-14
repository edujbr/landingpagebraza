import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export const supabaseConfigured = Boolean(url && anonKey)

export function createServerClient(): SupabaseClient | null {
  if (!url || !anonKey) return null
  return createClient(url, anonKey, { auth: { persistSession: false, autoRefreshToken: false } })
}

let browserClient: SupabaseClient | null = null

export function getBrowserClient(): SupabaseClient {
  if (!url || !anonKey) throw new Error('Supabase não configurado: defina NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY.')
  browserClient ??= createClient(url, anonKey)
  return browserClient
}
