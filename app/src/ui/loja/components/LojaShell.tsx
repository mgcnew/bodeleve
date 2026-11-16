import { useState, type FormEvent, type ReactNode } from 'react'
import { Link, NavLink, Outlet, useMatches, useNavigate } from 'react-router-dom'
import { BottomNav } from '@/components/BottomNav'
import { IconButton, IconLink } from '@/components/Button'
import { Icon } from '@/components/Icon'
import { formatCents } from '@/domain/money'
import { plural } from '@/domain/catalog'
import { CartProvider, useCart } from '../state/cart'
import { CheckoutProvider } from '../state/checkout'
import { StoreInfoProvider } from '../state/storeInfo'
import l from '../loja.module.css'
import s from './LojaShell.module.css'

/** Opções de cada tela da loja, declaradas na rota (`handle`) */
export type LojaHandle = { tabs?: boolean; cartBar?: boolean }

const tabs = [
  { to: '/', label: 'Início', icon: 'inicio', end: true },
  { to: '/buscar', label: 'Buscar', icon: 'buscar' },
  { to: '/pedidos', label: 'Pedidos', icon: 'pedidos' },
  { to: '/perfil', label: 'Perfil', icon: 'perfil' },
] as const

export function LojaShell() {
  return (
    <StoreInfoProvider>
      <CartProvider>
        <CheckoutProvider>
          <ShellFrame />
        </CheckoutProvider>
      </CartProvider>
    </StoreInfoProvider>
  )
}

function ShellFrame() {
  const matches = useMatches()
  const handle = (matches.at(-1)?.handle ?? {}) as LojaHandle
  return (
    <div className={l.shell}>
      <DesktopHeader />
      <Outlet />
      {/* a barra inferior some em checkout, pagamento e telas de tarefa */}
      {(handle.tabs || handle.cartBar) && (
        <div className={`${l.bottomStack} ${s.mobileOnly}`}>
          {handle.cartBar && <CartBar />}
          {handle.tabs && <BottomNav items={[...tabs]} />}
        </div>
      )}
    </div>
  )
}

function DesktopHeader() {
  const { count } = useCart()
  const navigate = useNavigate()
  const [q, setQ] = useState('')
  const submit = (e: FormEvent) => {
    e.preventDefault()
    navigate(`/buscar?q=${encodeURIComponent(q)}`)
  }
  return (
    <header className={s.desk}>
      <Link to="/" className={s.brand}>
        Bodeleve
      </Link>
      <nav aria-label="Seções" className={s.sections}>
        <NavLink to="/buscar">Produtos</NavLink>
        <NavLink to="/linha">Linha Bodeleve</NavLink>
        <NavLink to="/sobre">Sobre a casa</NavLink>
        <NavLink to="/pedidos">Meus pedidos</NavLink>
      </nav>
      <form role="search" onSubmit={submit} className={`${l.searchBox} ${s.search}`}>
        <Icon name="buscar" size={20} />
        <input
          type="search"
          aria-label="Buscar produto"
          placeholder="Buscar na Bodeleve"
          className={l.searchInput}
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </form>
      <Link to="/sacola" className={s.bag}>
        <Icon name="sacola" size={20} />
        Sacola · {count}
      </Link>
    </header>
  )
}

/** "Ver sacola · 3 itens · R$ 00,00" — aparece quando há itens */
export function CartBar() {
  const { count, subtotalCents } = useCart()
  if (count === 0) return null
  return (
    <Link to="/sacola" className={s.cartBar}>
      <Icon name="sacola" />
      <span>Ver sacola · {plural(count, 'item', 'itens')}</span>
      <span className={l.num}>{formatCents(subtotalCents)}</span>
    </Link>
  )
}

/** Botão de sacola com contador */
export function CartButton({ outlined }: { outlined?: boolean }) {
  const { count } = useCart()
  return (
    <IconLink
      to="/sacola"
      icon="sacola"
      label={count ? `Abrir sacola, ${plural(count, 'item', 'itens')}` : 'Abrir sacola'}
      tone={outlined ? 'outlined' : 'plain'}
      className={s.relative}
    >
      {count > 0 && (
        <span aria-hidden="true" className={s.badge}>
          {count}
        </span>
      )}
    </IconLink>
  )
}

/**
 * Barra superior com voltar, título e (opcional) sacola.
 * `back`: destino fixo, ou "history" para voltar à tela anterior (com `fallback` se não houver).
 */
export function TopBar({
  title,
  back,
  fallback = '/',
  cart = true,
}: {
  title?: ReactNode
  back: string
  fallback?: string
  cart?: boolean
}) {
  const navigate = useNavigate()
  const goBack = () => {
    const idx = (window.history.state as { idx?: number } | null)?.idx ?? 0
    if (idx > 0) navigate(-1)
    else navigate(fallback)
  }
  return (
    <header className={s.topbar}>
      {back === 'history' ? (
        <IconButton icon="voltar" label="Voltar" iconSize={24} onClick={goBack} />
      ) : (
        <IconLink to={back} icon="voltar" label="Voltar" />
      )}
      <div className={s.topbarTitle}>{title}</div>
      {cart && <CartButton />}
    </header>
  )
}

export const mobileOnly = s.mobileOnly

export function PageHeader({ title }: { title: string }) {
  return (
    <header className={l.pageHeader}>
      <h1 className={l.pageTitle}>{title}</h1>
    </header>
  )
}
