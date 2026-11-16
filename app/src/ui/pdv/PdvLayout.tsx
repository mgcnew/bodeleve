import { useEffect } from 'react'
import { Navigate, Outlet, useMatches, useLocation, useNavigate } from 'react-router-dom'
import { Banner, BottomNav, Button, EmptyState, StatusTag, type NavItem } from '@/components'
import { hhmm } from '@/domain/deliveries'
import { can } from '@/permissions'
import { useServices } from '@/services'
import { useAdminSession } from '@/store/admin'
import { useInvalidatePos, useOnline, usePosOverview } from './queries'
import l from '@/ui/loja/loja.module.css'
import s from '@/ui/gestao/gestao.module.css'

export type PdvHandle = { nav?: boolean; header?: boolean }

const navItems = (path: string): NavItem[] => [
  { label: 'Vender', icon: 'vender', href: '/pdv/vender', active: path === '/pdv/vender' },
  { label: 'Vendas', icon: 'historico', href: '/pdv/vendas', active: path.startsWith('/pdv/vendas') },
  { label: 'Caixa', icon: 'caixa', href: '/pdv/caixa', active: path === '/pdv/caixa' },
]

/** Moldura do balcão: cabeçalho com o caixa, aviso de falta de conexão e a barra Vender · Vendas · Caixa. */
export function PdvLayout() {
  const user = useAdminSession((x) => x.user)
  const signOut = useAdminSession((x) => x.signOut)
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const matches = useMatches()
  const handle = (matches[matches.length - 1]?.handle ?? {}) as PdvHandle
  const online = useOnline()
  const overview = usePosOverview()
  const { admin } = useServices()
  const invalidate = useInvalidatePos()
  const pending = overview.data?.pendingSales ?? 0

  // Voltou a conexão: as vendas guardadas neste aparelho seguem.
  useEffect(() => {
    if (online && pending > 0) void admin.pos.syncPending().then(() => invalidate())
  }, [online, pending, admin, invalidate])

  if (!user) return <Navigate to="/gestao/entrar" replace />
  if (!can(user.role, 'pos')) {
    return (
      <main className={l.centerBox}>
        <EmptyState icon="alerta" title="Você não tem acesso ao balcão" description="Peça ao dono ou ao gestor se precisar dele." action={<Button onClick={() => { signOut(); navigate('/gestao/entrar') }}>Sair</Button>} />
      </main>
    )
  }
  const session = overview.data?.session ?? null

  return (
    <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', background: 'var(--fundo-operacao)', color: 'var(--texto)' }}>
      {handle.header && (
        <header className={s.header} style={{ alignItems: 'center' }}>
          <div>
            <h1 className={s.title} style={{ margin: 0 }}>Balcão</h1>
            <div className={s.date}>{session ? `Caixa aberto · ${session.openedBy} · desde ${hhmm(session.openedAt)}` : 'Caixa fechado'}</div>
          </div>
          <StatusTag tone={session ? 'success' : 'neutral'}>{session ? 'Aberto' : 'Fechado'}</StatusTag>
        </header>
      )}
      {!online && (
        <div style={{ padding: '0 16px' }}>
          <Banner tone="warning" icon="sem-conexao">Sem conexão. As vendas ficam neste aparelho e seguem quando a conexão voltar.</Banner>
        </div>
      )}
      {online && pending > 0 && (
        <div style={{ padding: '0 16px' }} role="status">
          <Banner tone="warning" icon="sem-conexao">Enviando {pending} {pending === 1 ? 'venda guardada' : 'vendas guardadas'} neste aparelho…</Banner>
        </div>
      )}
      <div className={s.page} style={{ flex: '1 1 auto' }}>
        <Outlet />
      </div>
      {handle.nav && (
        <div className={s.bottom}>
          <BottomNav items={navItems(pathname)} label="Navegação do caixa" />
        </div>
      )}
    </div>
  )
}
