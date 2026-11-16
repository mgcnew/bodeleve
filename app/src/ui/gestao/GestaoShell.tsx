import { useEffect } from 'react'
import { Navigate, NavLink, Outlet, useLocation, useMatches } from 'react-router-dom'
import { BottomNav } from '@/components/BottomNav'
import { Icon, type IconName } from '@/components/Icon'
import { canAccess, type Module } from '@/permissions/modules'
import { startStaffSync } from '@/services/gestao/ordersRemote'
import { sessionStore } from '@/services/gestao/session'
import s from './GestaoShell.module.css'

export type GestaoHandle = { tabs?: boolean }

const menu: { module: Module; to: string; label: string; icon: IconName }[] = [
  { module: 'inicio', to: '/gestao', label: 'Início', icon: 'inicio' },
  { module: 'pedidos', to: '/gestao/pedidos', label: 'Pedidos', icon: 'pedidos' },
  { module: 'estoque', to: '/gestao/estoque', label: 'Estoque', icon: 'estoque' },
  { module: 'financeiro', to: '/gestao/financeiro', label: 'Financeiro', icon: 'financeiro' },
  { module: 'compras', to: '/gestao/compras', label: 'Compras', icon: 'compras' },
  { module: 'fornecedores', to: '/gestao/fornecedores', label: 'Fornecedores', icon: 'entregas' },
  { module: 'producao', to: '/gestao/producao', label: 'Produção', icon: 'producao' },
  { module: 'produtos', to: '/gestao/produtos', label: 'Produtos', icon: 'vender' },
  { module: 'clientes', to: '/gestao/clientes', label: 'Clientes', icon: 'perfil' },
  { module: 'entregas', to: '/gestao/entregas', label: 'Entregas', icon: 'local' },
  { module: 'relatorios', to: '/gestao/relatorios', label: 'Relatórios', icon: 'historico' },
  { module: 'configuracoes', to: '/gestao/configuracoes', label: 'Configurações', icon: 'mais' },
]

// A — Gestão no celular: 5 destinos com "Mais" (P-D)
const tabs = [
  { to: '/gestao', label: 'Início', icon: 'inicio', end: true },
  { to: '/gestao/pedidos', label: 'Pedidos', icon: 'pedidos' },
  { to: '/gestao/estoque', label: 'Estoque', icon: 'estoque' },
  { to: '/gestao/financeiro', label: 'Financeiro', icon: 'financeiro' },
  { to: '/gestao/mais', label: 'Mais', icon: 'mais' },
] as const

export function GestaoShell() {
  const session = sessionStore.useStore()
  const location = useLocation()
  const matches = useMatches()
  const handle = (matches.at(-1)?.handle ?? {}) as GestaoHandle
  const signedIn = !!session

  // com o Supabase, mantém os pedidos em dia (busca, Realtime e a cada 15 s)
  useEffect(() => (signedIn ? startStaffSync() : undefined), [signedIn])

  if (!session) return <Navigate to="/gestao/entrar" replace state={{ from: location.pathname }} />

  return (
    <div className={s.shell}>
      <nav aria-label="Módulos" className={s.side}>
        <div className={s.brand}>Bodeleve</div>
        {menu
          .filter((m) => canAccess(session.role, m.module))
          .map((m) => (
            <NavLink key={m.to} to={m.to} end={m.to === '/gestao'}>
              <Icon name={m.icon} size={20} />
              <span>{m.label}</span>
            </NavLink>
          ))}
        <div className={s.sideFoot}>{session.name} · {session.establishment}</div>
      </nav>
      <div className={s.content}>
        <Outlet />
        {handle.tabs && (
          <div className={s.bottom}>
            <BottomNav items={[...tabs]} />
          </div>
        )}
      </div>
    </div>
  )
}
