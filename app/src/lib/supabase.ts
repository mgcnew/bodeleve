import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

/**
 * Cliente do Supabase, ou null enquanto .env.local não estiver preenchido.
 * Os serviços em src/services caem nos mocks quando é null.
 */
export const supabase: SupabaseClient | null = url && key ? createClient(url, key) : null
