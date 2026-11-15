import { Navigate, Outlet, useLocation, useMatches, useNavigate } from 'react-router-dom'
import { BottomNav, Button, EmptyState, SideMenu, type NavItem } from '@/components'
import { can, roleLabel, type Module } from '@/permissions'
import { useAdminSession } from '@/store/admin'
import { entries, tabKeys } from './modules'
import l from '@/ui/loja/loja.module.css'
import s from './gestao.module.css'

export type GestaoHandle = { module?: Module; tabs?: boolean }

function isActive(path: string, to: string): boolean {
  return to === '/gestao' ? path === '/gestao' : path === to || path.startsWith(`${to}/`)
}

/** Moldura da Gestão: menu lateral a partir de 768 px, barra de 5 abas no celular. Esconde o que o papel não acessa (H-G27). */
export function GestaoLayout() {
  const user = useAdminSession((x) => x.user)
  const signOut = useAdminSession((x) => x.signOut)
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const matches = useMatches()
  const handle = (matches[matches.length - 1]?.handle ?? {}) as GestaoHandle

  if (!user) return <Navigate to="/gestao/entrar" replace />

  const allowed = entries.filter((e) => can(user.role, e.module))
  const sideItems: NavItem[] = allowed.map((e) => ({ label: e.label, icon: e.icon, href: e.to, active: isActive(pathname, e.to) }))

  const tabs = tabKeys.map((k) => entries.find((e) => e.key === k)!).filter((e) => can(user.role, e.module))
  const onTab = tabs.some((e) => isActive(pathname, e.to))
  const tabItems: NavItem[] = [
    ...tabs.map((e) => ({ label: e.label === 'Vendas e pedidos' ? 'Pedidos' : e.label, icon: e.icon, href: e.to, active: isActive(pathname, e.to) })),
    { label: 'Mais', icon: 'mais', href: '/gestao/mais', active: !onTab },
  ]

  const blocked = user.role === 'courier'
  const noAccess = !blocked && handle.module && !can(user.role, handle.module)

  return (
    <div className={s.screen}>
      <aside className={s.side}>
        <SideMenu items={sideItems} />
        <div className={l.card} style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div>
            <div className={l.strong}>{user.name}</div>
            <div className={l.sub}>{roleLabel[user.role]}</div>
          </div>
          <Button variant="secondary" onClick={() => { signOut(); navigate('/gestao/entrar') }}>Sair</Button>
        </div>
      </aside>
      <div className={s.col}>
        <div className={s.page}>
          {blocked ? (
            <main className={l.centerBox}>
              <EmptyState
                icon="entregas"
                title="Entregadores usam o app de Entregas"
                description="Esta área é da equipe da casa. O app de Entregas chega na Etapa 6."
                action={<Button onClick={() => { signOut(); navigate('/gestao/entrar') }}>Sair</Button>}
              />
            </main>
          ) : noAccess ? (
            <main className={l.centerBox}>
              <EmptyState icon="alerta" title="Você não tem acesso a esta área" description="Peça ao dono ou ao gestor se precisar dela." action={<Button onClick={() => navigate('/gestao')}>Voltar</Button>} />
            </main>
          ) : (
            <Outlet />
          )}
        </div>
        {handle.tabs && !blocked && (
          <div className={`${s.bottom} ${s.tabsOnly}`}>
            <BottomNav items={tabItems} label="Navegação da gestão" />
          </div>
        )}
      </div>
    </div>
  )
}
