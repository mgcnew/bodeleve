import { useEffect, useState } from 'react'
import { Link, Navigate, Outlet, useLocation, useMatches, useNavigate } from 'react-router-dom'
import { Button, ButtonLink } from '@/components/Button'
import { Sheet } from '@/components/Sheet'
import { roleLabels } from '@/permissions/roles'
import { BottomNav } from '@/components/BottomNav'
import { Icon } from '@/components/Icon'
import { hourMinute } from '@/domain/dates'
import { formatCents } from '@/domain/money'
import { cartTotal } from '@/domain/pdv'
import { startBackofficeSync } from '@/services/gestao/backofficeRemote'
import { sessionStore, signOut } from '@/services/gestao/session'
import { cartStore, cashStore, queueStore } from '@/services/pdv'
import { startPdvSync } from '@/services/pdvRemote'
import { resetLoaded, useFirstLoad } from '@/services/firstLoad'
import { ScreenSkeleton } from '@/components/ScreenSkeleton'
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
  const ready = useFirstLoad(['backoffice', 'pdv'])

  // com o Supabase, mantém itens, estoque, caixa e vendas em dia
  useEffect(() => {
    if (!signedIn) return
    const stopBackoffice = startBackofficeSync()
    const stopPdv = startPdvSync()
    return () => {
      stopBackoffice()
      stopPdv()
      resetLoaded()
    }
  }, [signedIn])

  if (!session) return <Navigate to="/gestao/entrar" replace state={{ from: location.pathname }} />

  const count = cart.lines.length
  return (
    <div className={s.shell}>
      <div className={s.content}>
        {ready ? (
          <div key={location.pathname} className="rota entra">
            <Outlet />
          </div>
        ) : (
          <ScreenSkeleton kind="list" tabs={handle.tabs} />
        )}
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
          {handle.tabs && <BottomNav items={[...tabs]} rail />}
        </div>
      )}
    </div>
  )
}

/** Cabeçalho com o estado do caixa */
export function CashHeader() {
  const { session } = cashStore.useStore()
  const open = !!session && !session.closedAt
  const queued = queueStore.useStore().length
  const me = sessionStore.useStore()
  const navigate = useNavigate()
  const [menu, setMenu] = useState(false)
  return (
    <header className={s.head}>
      <div>
        <div className={s.headTitle}>Balcão</div>
        <div className={s.headSub}>{open ? `${session!.openedBy} · aberto às ${hourMinute(session!.openedAt)}` : 'Caixa fechado'}</div>
      </div>
      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
        {queued > 0 && <Tag tone="warning">{queued} a enviar</Tag>}
        <Tag tone={open ? 'success' : 'warning'}>{open ? 'Caixa aberto' : 'Caixa fechado'}</Tag>
        <button
          type="button"
          aria-label="Minha conta e sair"
          onClick={() => setMenu(true)}
          style={{ width: 44, height: 44, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', border: 0, background: 'transparent', color: 'inherit', cursor: 'pointer' }}
        >
          <Icon name="perfil" size={22} />
        </button>
      </div>
      <Sheet open={menu} onClose={() => setMenu(false)} title={me?.name ?? 'Minha conta'}>
        {me && <p className={s.headSub}>{roleLabels[me.role]} · {me.email}</p>}
        <p className={s.headSub}>{queued > 0 ? `Há ${queued} ${queued === 1 ? 'venda' : 'vendas'} sem enviar neste aparelho. Saia só depois que forem enviadas.` : open ? 'O caixa continua aberto depois que você sair.' : 'O caixa está fechado.'}</p>
        <ButtonLink to="/gestao/configuracoes/perfil" variant="secondary" block>
          Meu perfil e senha
        </ButtonLink>
        <Button
          variant="danger"
          block
          disabled={queued > 0}
          onClick={() => {
            signOut()
            navigate('/gestao/entrar')
          }}
        >
          Sair
        </Button>
        <Button variant="quiet" block onClick={() => setMenu(false)}>
          Voltar
        </Button>
      </Sheet>
    </header>
  )
}
