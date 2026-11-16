import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

/**
 * Ligação com o Supabase. A chave é a PÚBLICA (segura no navegador): quem protege os dados são as políticas RLS e as funções do banco.
 * Só liga com `VITE_DATA_SOURCE=supabase`; sem isso o app continua nos serviços simulados (src/mocks).
 */
export type Db = SupabaseClient<Database>

const url: string | undefined = import.meta.env.VITE_SUPABASE_URL
const key: string | undefined = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

/** Identificador da casa na loja pública (establishments.slug). */
export const storeSlug: string = import.meta.env.VITE_STORE_SLUG || 'bodeleve'

export function createDb(): Db {
  if (!url || !key) throw new Error('supabase_not_configured')
  return createClient<Database>(url, key, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false } })
}

/** O erro de uma função do banco vem na mensagem ("insufficient_stock", "forbidden:…"); o app trabalha com esse código. */
export function codeOf(error: { message: string } | null | undefined): string {
  return (error?.message ?? 'unknown').split(':')[0].trim()
}

export class ServiceError extends Error {
  constructor(public code: string, public detail?: string) {
    super(code)
  }
}

/** Lança o erro de uma chamada do Supabase como Error(código), do mesmo jeito que os serviços simulados. */
export function unwrap<T>(res: { data: T | null; error: { message: string } | null }): T {
  if (res.error) {
    const [code, ...rest] = res.error.message.split(':')
    throw new ServiceError(code.trim(), rest.join(':').trim() || undefined)
  }
  return res.data as T
}
