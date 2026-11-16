import type { Db } from '../client'

/**
 * Contexto da Gestão sobre o Supabase: qual é a casa da pessoa que entrou. Vem do vínculo ativo dela (memberships), nunca do aparelho.
 * Todas as telas da Gestão trabalham numa casa só; guardamos a resposta enquanto a sessão for a mesma.
 */
export type AdminContext = {
  client: Db
  /** Id da casa da pessoa que está logada. Lança `forbidden` sem sessão ou sem vínculo. */
  establishment(): Promise<string>
  /** Esquece a casa guardada (ao sair). */
  reset(): void
}

export function createAdminContext(client: Db): AdminContext {
  let cached: { user: string; est: Promise<string> } | null = null
  return {
    client,
    reset() {
      cached = null
    },
    async establishment() {
      const { data } = await client.auth.getSession()
      const user = data.session?.user.id
      if (!user) throw new Error('forbidden')
      if (!cached || cached.user !== user) {
        const est = (async () => {
          const { data: m } = await client
            .from('memberships')
            .select('establishment_id')
            .eq('user_id', user)
            .eq('status', 'active')
            .neq('role', 'courier')
            .limit(1)
            .maybeSingle()
          if (!m) throw new Error('forbidden')
          return m.establishment_id
        })()
        cached = { user, est }
        est.catch(() => {
          if (cached?.est === est) cached = null
        })
      }
      return cached.est
    },
  }
}
