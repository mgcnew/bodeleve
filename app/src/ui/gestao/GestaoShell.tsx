import { useCallback, useEffect, useState } from 'react'
import { Navigate, NavLink, Outlet, useLocation, useMatches, useNavigate } from 'react-router-dom'
import { BottomNav } from '@/components/BottomNav'
import { Icon, type IconName } from '@/components/Icon'
import { canAccess, type Module } from '@/permissions/modules'
import { startBackofficeSync } from '@/services/gestao/backofficeRemote'
import { startFinanceSync } from '@/services/gestao/financeRemote'
import { startStaffSync } from '@/services/gestao/ordersRemote'
import { resetLoaded, useFirstLoad } from '@/services/firstLoad'
import { ScreenSkeleton, type SkeletonKind } from '@/components/ScreenSkeleton'
import { sessionStore, signOut } from '@/services/gestao/session'
import { CommandPalette, useGestaoShortcuts } from './components/CommandPalette'
import s from './GestaoShell.module.css'

export type GestaoHandle = { tabs?: boolean }

// esqueleto no formato da tela: início = painel, nível 1 = lista, o resto = detalhe
function skeletonKind(path: string): SkeletonKind {
  const depth = path.replace(/^\/gestao\/?/, '').split('/').filter(Boolean).length
  return depth === 0 ? 'dashboard' : depth === 1 ? 'list' : 'detail'
}

type MenuItem = { module: Module; to: string; label: string; icon: IconName }

// menu lateral do computador: os 12 módulos em quatro grupos de trabalho
const menuGroups: { title: string; items: MenuItem[] }[] = [
  {
    title: 'Dia a dia',
    items: [
      { module: 'inicio', to: '/gestao', label: 'Início', icon: 'inicio' },
      { module: 'pedidos', to: '/gestao/pedidos', label: 'Pedidos', icon: 'pedidos' },
      { module: 'entregas', to: '/gestao/entregas', label: 'Entregas', icon: 'local' },
      { module: 'clientes', to: '/gestao/clientes', label: 'Clientes', icon: 'perfil' },
    ],
  },
  {
    title: 'Abastecer',
    items: [
      { module: 'estoque', to: '/gestao/estoque', label: 'Estoque', icon: 'estoque' },
      { module: 'compras', to: '/gestao/compras', label: 'Compras', icon: 'compras' },
      { module: 'fornecedores', to: '/gestao/fornecedores', label: 'Fornecedores', icon: 'entregas' },
      { module: 'producao', to: '/gestao/producao', label: 'Produção', icon: 'producao' },
      { module: 'produtos', to: '/gestao/produtos', label: 'Produtos', icon: 'vender' },
    ],
  },
  {
    title: 'Dinheiro',
    items: [
      { module: 'financeiro', to: '/gestao/financeiro', label: 'Financeiro', icon: 'financeiro' },
      { module: 'relatorios', to: '/gestao/relatorios', label: 'Relatórios', icon: 'historico' },
    ],
  },
  { title: 'Sistema', items: [{ module: 'configuracoes', to: '/gestao/configuracoes', label: 'Configurações', icon: 'mais' }] },
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
  const navigate = useNavigate()
  const location = useLocation()
  const matches = useMatches()
  const handle = (matches.at(-1)?.handle ?? {}) as GestaoHandle
  const signedIn = !!session
  const ready = useFirstLoad(['orders', 'backoffice', 'finance'])
  const [palette, setPalette] = useState(false)
  const openPalette = useCallback(() => setPalette(true), [])
  useGestaoShortcuts(session?.role, openPalette)

  // com o Supabase, mantém pedidos, estoque e compras em dia (busca ao abrir e a cada poucos segundos)
  useEffect(() => {
    if (!signedIn) return
    const stopOrders = startStaffSync()
    const stopBackoffice = startBackofficeSync()
    const stopFinance = startFinanceSync()
    return () => {
      stopOrders()
      stopBackoffice()
      stopFinance()
      resetLoaded()
    }
  }, [signedIn])

  if (!session) return <Navigate to="/gestao/entrar" replace state={{ from: location.pathname }} />

  return (
    <div className={s.shell}>
      <nav aria-label="Módulos" className={s.side}>
        <div className={s.brand}>Bodeleve</div>
        <button type="button" className={s.search} onClick={openPalette} aria-label="Buscar ou ir para, atalho Control K">
          <Icon name="buscar" size={18} />
          <span>Buscar ou ir para…</span>
          <kbd>Ctrl K</kbd>
        </button>
        {menuGroups.map((g) => {
          const items = g.items.filter((m) => canAccess(session.role, m.module))
          if (items.length === 0) return null
          return (
            <div key={g.title} className={s.group}>
              <div className={s.groupTitle}>{g.title}</div>
              {items.map((m) => (
                <NavLink key={m.to} to={m.to} end={m.to === '/gestao'}>
                  <Icon name={m.icon} size={20} />
                  <span>{m.label}</span>
                </NavLink>
              ))}
            </div>
          )
        })}
        <div className={s.sideFoot}>
          <NavLink to="/gestao/perfil">
            <Icon name="perfil" size={20} />
            <span>
              {session.name}
              <small>{session.establishment}</small>
            </span>
          </NavLink>
          <button
            type="button"
            onClick={() => {
              signOut()
              navigate('/gestao/entrar')
            }}
          >
            Sair da conta
          </button>
        </div>
      </nav>
      <CommandPalette open={palette} onClose={() => setPalette(false)} role={session.role} />
      <div className={s.content}>
        {ready ? (
          <div key={location.pathname} className="rota entra">
            <Outlet />
          </div>
        ) : (
          <ScreenSkeleton kind={skeletonKind(location.pathname)} tabs={handle.tabs} />
        )}
        {handle.tabs && (
          <div className={s.bottom}>
            <BottomNav items={[...tabs]} />
          </div>
        )}
      </div>
    </div>
  )
}
