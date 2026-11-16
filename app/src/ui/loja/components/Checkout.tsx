import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Icon } from '@/components/Icon'
import { formatTime, type Order, type OrderStatus } from '@/domain/order'
import l from '../loja.module.css'
import s from './Checkout.module.css'

const STEP_NAMES = ['Identificação', 'Entrega', 'Pagamento', 'Revisão']

/** "Etapa 2 de 4 · Entrega" (H-L6) */
export function StepProgress({ step }: { step: 1 | 2 | 3 | 4 }) {
  return (
    <div className={s.steps}>
      <div className={s.bars} aria-hidden="true">
        {STEP_NAMES.map((name, i) => (
          <span key={name} className={`${s.bar} ${i < step ? s.done : ''}`} />
        ))}
      </div>
      <div className={l.muted}>
        Etapa {step} de 4 · {STEP_NAMES[step - 1]}
      </div>
    </div>
  )
}

export function DeliveryCode({ code }: { code: string }) {
  return (
    <div className={s.code}>
      <div>
        <div className={s.codeTitle}>Código de entrega</div>
        <div className={l.small} style={{ color: 'var(--texto)' }}>
          Informe ao entregador ao receber.
        </div>
      </div>
      <div className={s.codeValue} aria-label={`Código ${code.split('').join(' ')}`}>
        {code}
      </div>
    </div>
  )
}

type StepState = 'ok' | 'now' | 'later'

function flow(order: Order): { status: OrderStatus; title: string; sub?: string }[] {
  const out: OrderStatus = order.fulfillment === 'delivery' ? 'out_for_delivery' : 'ready_for_pickup'
  const end: OrderStatus = order.fulfillment === 'delivery' ? 'delivered' : 'picked_up'
  return [
    { status: 'received', title: 'Pedido recebido' },
    { status: 'preparing', title: 'Em preparo', sub: 'A casa está separando seus itens' },
    {
      status: out,
      title: order.fulfillment === 'delivery' ? 'Saiu para entrega' : 'Pronto para retirar',
      sub: order.courierNote ?? undefined,
    },
    { status: end, title: order.fulfillment === 'delivery' ? 'Entregue' : 'Retirado' },
  ]
}

/**
 * Linha do tempo do pedido. `highlightCurrent`: a etapa atual ganha destaque
 * (acompanhamento); sem ele, só as etapas cumpridas aparecem como feitas (confirmação).
 */
export function OrderTimeline({ order, highlightCurrent }: { order: Order; highlightCurrent?: boolean }) {
  const steps = flow(order)
  const current = steps.findIndex((st) => st.status === order.status)
  return (
    <ol className={s.timeline}>
      {steps.map((st, i) => {
        const state: StepState =
          i < current || (i === current && !highlightCurrent) ? 'ok' : i === current ? 'now' : 'later'
        const time = order.statusTimes[st.status]
        // descrição só na etapa atual (acompanhamento) ou na próxima (confirmação)
        const showSub = highlightCurrent ? i === current : i === current + 1
        const sub = [time && formatTime(time), showSub && st.sub].filter(Boolean).join(' · ')
        return (
          <li key={st.status} className={s.step} aria-current={state === 'now' ? 'step' : undefined}>
            <span aria-hidden="true" className={`${s.dot} ${state === 'ok' ? s.dotOk : state === 'now' ? s.dotNow : ''}`}>
              {state === 'ok' && <Icon name="confirmar" size={14} />}
            </span>
            <div>
              <div className={`${s.stepTitle} ${state === 'later' ? s.later : state === 'now' ? s.now : ''}`}>
                {st.title}
                <span className="sr-only">{state === 'ok' ? ' (concluído)' : state === 'now' ? ' (agora)' : ''}</span>
              </div>
              {sub && <div className={l.small}>{sub}</div>}
            </div>
          </li>
        )
      })}
    </ol>
  )
}

export function ReviewBlock({ title, to, children }: { title: string; to: string; children: ReactNode }) {
  return (
    <section className={s.reviewBlock}>
      <div className={s.reviewHead}>
        <h2 className={s.reviewTitle}>{title}</h2>
        <Link to={to} aria-label={`Alterar ${title.toLowerCase()}`} className={l.linkInline}>
          Alterar
        </Link>
      </div>
      {children}
    </section>
  )
}

export function Place({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className={s.place}>
      <Icon name="local" size={22} />
      <div className={s.placeText}>{children}</div>
      {action}
    </div>
  )
}

export function FeeLine({ label, value, free }: { label: string; value: string; free?: boolean }) {
  return (
    <div className={`${s.fee} ${free ? s.feeFree : ''}`}>
      <span>{label}</span>
      <b>{value}</b>
    </div>
  )
}
