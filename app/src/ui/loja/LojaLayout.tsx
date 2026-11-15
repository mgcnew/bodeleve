import { useState, type FormEvent } from 'react'
import { Outlet, useLocation, useMatches, useNavigate } from 'react-router-dom'
import { AppLink, BagBar, BottomNav, Icon, SearchField, type NavItem } from '@/components'
import { cx } from '@/lib/cx'
import { itemsLabel } from '@/domain/bag'
import { useBagSummary } from './useBagSummary'
import s from './loja.module.css'

export type LojaHandle = { tabs?: boolean; bagBar?: boolean; narrow?: boolean }

const tabItems = (path: string): NavItem[] => [
  { label: 'Início', icon: 'inicio', href: '/', active: path === '/' },
  { label: 'Buscar', icon: 'buscar', href: '/buscar', active: path.startsWith('/buscar') || path.startsWith('/categoria') },
  { label: 'Pedidos', icon: 'pedidos', href: '/pedidos', active: path.startsWith('/pedidos') },
  { label: 'Perfil', icon: 'perfil', href: '/perfil', active: path === '/perfil' },
]

function DeskHeader() {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const { totals } = useBagSummary()
  const [q, setQ] = useState('')
  const submit = (e: FormEvent) => {
    e.preventDefault()
    navigate(q.trim() ? `/buscar?q=${encodeURIComponent(q.trim())}` : '/buscar')
  }
  const cur = (p: string) => (pathname === p || (p !== '/' && pathname.startsWith(p)) ? ('page' as const) : undefined)
  return (
    <header className={s.deskHeader}>
      <AppLink href="/" className={s.brand}>Bodeleve</AppLink>
      <nav aria-label="Seções" className={s.deskNav}>
        <AppLink href="/buscar" aria-current={cur('/buscar')}>Produtos</AppLink>
        <AppLink href="/linha" aria-current={cur('/linha')}>Linha Bodeleve</AppLink>
        <AppLink href="/sobre" aria-current={cur('/sobre')}>Sobre a casa</AppLink>
        <AppLink href="/pedidos" aria-current={cur('/pedidos')}>Meus pedidos</AppLink>
      </nav>
      <form role="search" aria-label="Buscar no topo" className={s.deskSearch} onSubmit={submit}>
        <SearchField label="Buscar na Bodeleve" value={q} onChange={(e) => setQ(e.target.value)} />
      </form>
      <AppLink href="/sacola" className={s.deskBag}>
        <Icon name="sacola" size={20} />
        Sacola{totals.itemCount > 0 ? ` · ${totals.itemCount}` : ''}
      </AppLink>
    </header>
  )
}

/** Moldura da loja: topo no computador; barra de sacola e abas no celular e no tablet. Cada rota diz o que mostra em `handle`. */
export function LojaLayout() {
  const matches = useMatches()
  const handle = (matches[matches.length - 1]?.handle ?? {}) as LojaHandle
  const { pathname } = useLocation()
  const { totals } = useBagSummary()
  const showBar = handle.bagBar && totals.itemCount > 0
  return (
    <div className={s.screen}>
      <DeskHeader />
      <div className={cx(s.page)}>
        <Outlet />
      </div>
      {(handle.tabs || showBar) && (
        <div className={cx(s.bottom, s.mobileOnly)}>
          {showBar && <BagBar itemCount={totals.itemCount} totalCents={totals.totalCents} href="/sacola" />}
          {handle.tabs && <BottomNav items={tabItems(pathname)} />}
        </div>
      )}
      <span className="sr-only" aria-live="polite">{totals.itemCount > 0 ? `Sacola: ${itemsLabel(totals.itemCount)}` : ''}</span>
    </div>
  )
}
