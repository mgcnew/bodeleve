import { Navigate, Outlet, useLocation, useMatches } from 'react-router-dom'
import { BottomNav, type NavItem } from '@/components'
import { useCourierSession } from '@/store/courier'
import s from '@/ui/gestao/gestao.module.css'

export type EntregasHandle = { nav?: boolean }

const navItems = (path: string): NavItem[] => [
  { label: 'Entregas', icon: 'entregas', href: '/entregas', active: path === '/entregas' || path.startsWith('/entregas/pedido') },
  { label: 'Histórico', icon: 'historico', href: '/entregas/historico', active: path === '/entregas/historico' },
  { label: 'Perfil', icon: 'perfil', href: '/entregas/perfil', active: path === '/entregas/perfil' },
]

/** Moldura do app do entregador: só entra quem a casa cadastrou. */
export function EntregasLayout() {
  const courierId = useCourierSession((x) => x.courierId)
  const { pathname } = useLocation()
  const matches = useMatches()
  const handle = (matches[matches.length - 1]?.handle ?? {}) as EntregasHandle
  if (!courierId) return <Navigate to="/entregas/entrar" replace />
  return (
    <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', background: 'var(--fundo-operacao)', color: 'var(--texto)' }}>
      <div className={s.page} style={{ flex: '1 1 auto' }}>
        <Outlet />
      </div>
      {handle.nav && (
        <div className={s.bottom}>
          <BottomNav items={navItems(pathname)} label="Navegação do entregador" />
        </div>
      )}
    </div>
  )
}
