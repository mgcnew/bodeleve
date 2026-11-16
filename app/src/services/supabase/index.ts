import { createMockServices, type MockOptions } from '@/mocks/services'
import type { Services } from '@/services/types'
import { createSupabaseAdminAuth } from './adminAuth'
import { createDb, storeSlug, type Db } from './client'
import { createSupabaseStore } from './store'

export { storeSlug } from './client'

/**
 * Serviços sobre o Supabase, ligados por partes. Já são reais: loja pública (catálogo, pedido, acompanhamento, A casa) e entrada da equipe.
 * O que ainda não foi ligado (Gestão, PDV, Entregas) continua nos serviços simulados até ganhar a versão real; veja `docs/ROADMAP.md`.
 * Por isso este modo só liga com `VITE_DATA_SOURCE=supabase` e não é o padrão.
 */
export function createSupabaseServices(opts: { client?: Db; mock?: MockOptions } = {}): Services {
  const client = opts.client ?? createDb()
  const base = createMockServices(opts.mock)
  const store = createSupabaseStore({ client, slug: storeSlug })
  return {
    ...base,
    ...store,
    admin: { ...base.admin, auth: createSupabaseAdminAuth(client) },
  }
}
