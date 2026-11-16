import { createMockServices, type MockOptions } from '@/mocks/services'
import { useAdminSession } from '@/store/admin'
import type { Services } from '@/services/types'
import { createSupabaseCatalogAdmin } from './admin/catalog'
import { createAdminContext } from './admin/context'
import { createHydratedAdmin } from './admin/hydrated'
import { createSupabaseCustomers } from './admin/customers'
import { createSupabaseOrdersAdmin } from './admin/orders'
import { createSupabaseSettings } from './admin/settings'
import { createSupabaseAdminAuth } from './adminAuth'
import { createDb, storeSlug, type Db } from './client'
import { createSupabaseStore } from './store'

export { storeSlug } from './client'

/**
 * Serviços sobre o Supabase, ligados por partes. Já são reais: loja pública (catálogo, pedido, acompanhamento, A casa), entrada da equipe,
 * e na Gestão: pedidos, produtos e categorias, clientes, A casa, equipe, estoque, compras, produção, financeiro e início. O que ainda não foi ligado (
 * entregas, relatórios, PDV, app de Entregas) continua nos serviços simulados até ganhar a versão real; veja `docs/ROADMAP.md`.
 * Por isso este modo só liga com `VITE_DATA_SOURCE=supabase` e não é o padrão.
 */
export function createSupabaseServices(opts: { client?: Db; mock?: MockOptions } = {}): Services {
  const client = opts.client ?? createDb()
  const ctx = createAdminContext(client)
  const base = createMockServices(opts.mock)
  const store = createSupabaseStore({ client, slug: storeSlug })

  // A sessão da Gestão neste aparelho e a do Supabase andam juntas: sair de uma encerra a outra.
  useAdminSession.subscribe((s, prev) => {
    if (prev.user && !s.user) {
      ctx.reset()
      void client.auth.signOut()
    }
  })
  client.auth.onAuthStateChange((event) => {
    if (event === 'SIGNED_OUT') {
      ctx.reset()
      if (useAdminSession.getState().user) useAdminSession.getState().signOut()
    }
  })
  void client.auth.getSession().then(({ data }) => {
    if (!data.session && useAdminSession.getState().user) useAdminSession.getState().signOut()
  })

  return {
    ...base,
    ...store,
    admin: {
      ...base.admin,
      auth: createSupabaseAdminAuth(client),
      orders: createSupabaseOrdersAdmin(ctx),
      catalog: createSupabaseCatalogAdmin(ctx),
      customers: createSupabaseCustomers(ctx),
      settings: createSupabaseSettings(ctx),
      ...createHydratedAdmin(ctx),
    },
  }
}
