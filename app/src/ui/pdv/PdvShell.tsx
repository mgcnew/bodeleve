import { useEffect } from 'react'
import { Link, Navigate, Outlet, useLocation, useMatches } from 'react-router-dom'
import { BottomNav } from '@/components/BottomNav'
import { Icon } from '@/components/Icon'
import { hourMinute } from '@/domain/dates'
import { formatCents } from '@/domain/money'
import { cartTotal } from '@/domain/pdv'
import { startBackofficeSync } from '@/services/gestao/backofficeRemote'
import { sessionStore } from '@/services/gestao/session'
import { cartStore, cashStore } from '@/services/pdv'
import { startPdvSync } from '@/services/pdvRemote'
import { Tag } from '@/components/Badges'
import s from './PdvShell.module.css'

export type PdvHandle = { tabs?: boolean; cartBar?: boolean }

const tabs = [
  { to: '/pdv', label: 'Vender', icon: 'vender', end: true },
  { to: '/pdv/vendas', label: 'Vendas', icon: 'historico' },
  { to: '/pdv/caixa', label: 'Caixa', icon: 'caixa' },
] as const

// B — PDV: exige login; quem opera é o atendente (ou gestor/dono)
export function PdvShell() {
  const session = sessionStore.useStore()
  const cart = cartStore.useStore()
  const location = useLocation()
  const handle = (useMatches().at(-1)?.handle ?? {}) as PdvHandle
  const signedIn = !!session

  // com o Supabase, mantém itens, estoque, caixa e vendas em dia
  useEffect(() => {
    if (!signedIn) return
    const stopBackoffice = startBackofficeSync()
    const stopPdv = startPdvSync()
    return () => {
      stopBackoffice()
      stopPdv()
    }
  }, [signedIn])

  if (!session) return <Navigate to="/gestao/entrar" replace state={{ from: location.pathname }} />

  const count = cart.lines.length
  return (
    <div className={s.shell}>
      <div className={s.content}>
        <Outlet />
      </div>
      {(handle.tabs || handle.cartBar) && (
        <div className={s.bottom}>
          {handle.cartBar && count > 0 && (
            <Link to="/pdv/sacola" className={s.cartBar}>
              <Icon name="sacola" />
              <span>Sacola · {count} {count === 1 ? 'item' : 'itens'}</span>
              <span style={{ fontVariantNumeric: 'tabular-nums' }}>{formatCents(cartTotal(cart))}</span>
            </Link>
          )}
          {handle.tabs && <BottomNav items={[...tabs]} />}
        </div>
      )}
    </div>
  )
}

/** Cabeçalho com o estado do caixa */
export function CashHeader() {
  const { session } = cashStore.useStore()
  const open = !!session && !session.closedAt
  return (
    <header className={s.head}>
      <div>
        <div className={s.headTitle}>Balcão</div>
        <div className={s.headSub}>{open ? `${session!.openedBy} · aberto às ${hourMinute(session!.openedAt)}` : 'Caixa fechado'}</div>
      </div>
      <Tag tone={open ? 'success' : 'warning'}>{open ? 'Caixa aberto' : 'Caixa fechado'}</Tag>
    </header>
  )
}
