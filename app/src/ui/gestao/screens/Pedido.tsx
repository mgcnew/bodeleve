import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { Tag } from '@/components/Badges'
import { Box } from '@/components/Card'
import { Button, ButtonLink } from '@/components/Button'
import { Banner, EmptyState } from '@/components/Feedback'
import { Icon } from '@/components/Icon'
import { fullDate, hourMinute, shortDate } from '@/domain/dates'
import { formatCents } from '@/domain/money'
import { staffStatusLabels, staffSubtotal, staffTotal, type StaffOrder } from '@/domain/staffOrder'
import { staffOrdersStore, toggleChecked } from '@/services/gestao/orders'
import { acceptOrder, actionErrorMessage, completePickup, creditDaysOf, markOrderReady, setOrderPayment, undoOrderReady } from '@/services/gestao/orderActions'
import { customersStore } from '@/services/gestao/people'
import o from '@/styles/ops.module.css'
import { Bar, StepBars, SumRow, SumTotal } from '../../shared/OpsBits'

const hints: Record<StaffOrder['status'], (x: StaffOrder) => string> = {
  new: (x) =>
    x.paid
      ? `Pago no ${x.paymentLabel}. Aceite para começar a separar.`
      : x.paymentLabel === 'Pix'
        ? 'Pix ainda sem confirmação. Aceite para começar a separar.'
        : `Pagamento ${x.fulfillment === 'delivery' ? 'na entrega' : 'na retirada'}. Aceite para começar a separar.`,
  separating: () => 'Marque cada item ao colocar na sacola.',
  ready: (x) => (x.fulfillment === 'delivery' ? 'O cliente foi avisado pelo WhatsApp. Aguardando entregador.' : 'O cliente foi avisado pelo WhatsApp. Aguardando retirada.'),
  en_route: (x) => `Saiu para entrega${x.courierName ? ` com ${x.courierName}` : ''}.`,
  delivered: () => 'Pedido entregue.',
}

const stepIndex = { new: 0, separating: 1, ready: 2, en_route: 3, delivered: 3 }

export function Pedido() {
  const { id = '' } = useParams()
  const order = staffOrdersStore.useStore().find((x) => x.id === id)
  const customers = customersStore.useStore()
  const [busy, setBusy] = useState(false)
  const [problem, setProblem] = useState<string>()
  const run = async (action: () => Promise<void>) => {
    setBusy(true)
    setProblem(undefined)
    try {
      await action()
    } catch (e) {
      setProblem(actionErrorMessage(e))
    } finally {
      setBusy(false)
    }
  }

  if (!order) {
    return (
      <div className={o.screen}>
        <Bar title="Pedido" back="/gestao/pedidos" />
        <EmptyState bare icon="pedidos" title="Pedido não encontrado" action={<ButtonLink to="/gestao/pedidos">Ver pedidos</ButtonLink>} />
      </div>
    )
  }

  const step = stepIndex[order.status]
  const checkedCount = order.checked.filter(Boolean).length
  const allChecked = checkedCount === order.items.length
  const conf = `${checkedCount} de ${order.items.length} conferidos`
  const phoneDigits = order.customer.phone.replace(/\D/g, '')
  const registered = customers.find((c) => c.phone.replace(/\D/g, '') === phoneDigits)
  const credit = registered?.creditDays ?? creditDaysOf(order)
  const open = order.status === 'new' || order.status === 'separating' || order.status === 'ready'
  const needsCredit = !!order.onAccount && !credit

  return (
    <div className={o.screen}>
      <Bar title={`Pedido #${order.number}`} back="/gestao/pedidos" />
      <main className={`${o.main} ${o.mainTop} ${o.narrow}`}>
        <div className={o.section}>
          <StepBars total={3} done={Math.min(step, 3)} current={step} />
          <div className={o.cardHead}>
            <span className={o.h1}>{staffStatusLabels[order.status]}</span>
            <span className={`${o.muted} ${o.num}`}>Recebido às {hourMinute(order.createdAt)}</span>
          </div>
          <div aria-live="polite" className={o.muted}>
            {hints[order.status](order)}
          </div>
        </div>

        {order.onAccount && open && (
          <section className={o.section}>
            {credit ? (
              <Banner tone="info">Pedido a prazo. Este cliente tem prazo de {credit} dias: a conta a receber é criada quando você marcar “Cliente retirou” e vence {credit} dias depois.</Banner>
            ) : (
              <Banner tone="warning">
                O cliente pediu pagamento a prazo, mas não tem prazo cadastrado. Combine com ele pelo WhatsApp: cadastre o prazo no cliente ou mude o pagamento para “na retirada”.
              </Banner>
            )}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <Button variant="secondary" disabled={busy} onClick={() => run(() => setOrderPayment(order.id, 'on_pickup'))}>
                Mudar para pagar na retirada
              </Button>
              {registered && !credit && (
                <ButtonLink to={`/gestao/clientes/${registered.id}`} variant="secondary">
                  Cadastrar prazo do cliente
                </ButtonLink>
              )}
            </div>
          </section>
        )}
        {!order.onAccount && credit && open && order.fulfillment === 'pickup' && (
          <div className={o.card}>
            <div className={o.muted}>Este cliente tem prazo de {credit} dias. Se combinaram pagar a prazo, mude aqui.</div>
            <Button variant="secondary" disabled={busy} onClick={() => run(() => setOrderPayment(order.id, 'on_account'))}>
              Marcar como a prazo
            </Button>
          </div>
        )}

        <section className={o.section}>
          <h2 className={o.h2}>Itens</h2>
          <Box>
            {order.status === 'separating'
              ? order.items.map((it, i) => (
                  <label key={it.productId} className={o.check}>
                    <input type="checkbox" checked={order.checked[i]} onChange={() => toggleChecked(order.id, i)} />
                    <span className={o.rowText}>
                      <span className={o.rowTitle}>{it.name}</span>
                      <span className={`${o.small} ${o.num}`}>
                        {it.qtyLabel}
                        {it.lot && ` · Lote ${it.lot}`}
                        {it.lotExpiry && ` · vence ${shortDate(it.lotExpiry)}`}
                      </span>
                    </span>
                    <span className={`${o.bold} ${o.num}`}>{formatCents(it.quantity * it.unitPriceCents)}</span>
                  </label>
                ))
              : order.items.map((it) => (
                  <div key={it.productId} className={o.row} style={{ minHeight: 56 }}>
                    <span className={o.rowText}>
                      <span className={o.rowTitle}>{it.name}</span>
                      <span className={`${o.small} ${o.num}`}>{it.qtyLabel}</span>
                    </span>
                    <span className={`${o.bold} ${o.num}`}>{formatCents(it.quantity * it.unitPriceCents)}</span>
                  </div>
                ))}
          </Box>
          {order.status === 'separating' && <div className={`${o.muted} ${o.num}`}>{conf}</div>}
          <div className={o.card}>
            <SumRow label="Subtotal" value={formatCents(staffSubtotal(order))} />
            <SumRow label={order.fulfillment === 'delivery' ? 'Entrega' : 'Retirada'} value={order.feeCents ? formatCents(order.feeCents) : 'Grátis'} />
            <SumTotal value={formatCents(staffTotal(order))} />
            <div style={{ paddingTop: 4 }}>
              {order.paid ? <Tag tone="success">Pago · {order.paymentLabel}</Tag> : <Tag tone="warning">{order.paymentLabel}</Tag>}
            </div>
          </div>
        </section>

        <section className={o.section}>
          <h2 className={o.h2}>Cliente e {order.fulfillment === 'delivery' ? 'entrega' : 'retirada'}</h2>
          <div className={o.card} style={{ gap: 10 }}>
            <div>
              <div className={o.bold}>{order.customer.name}</div>
              <div className={`${o.muted} ${o.num}`}>
                {order.customer.phone} · cliente desde {fullDate(order.customer.since).slice(3)} · {order.customer.orderCount} pedidos
              </div>
            </div>
            <div className={o.iconLine}>
              <Icon name="local" size={20} />
              <div>
                <div>{order.address ? order.address.line1 : 'Retirada na loja'}</div>
                <div className={o.muted}>
                  {order.address ? `${order.address.line2} · ` : ''}
                  {order.windowLabel}
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <div className={o.footer}>
        {problem && <Banner tone="error">{problem}</Banner>}
        {order.status === 'new' && (
          <Button size="l" block loading={busy} disabled={busy || needsCredit} onClick={() => run(() => acceptOrder(order.id))}>
            Aceitar e começar a separar
          </Button>
        )}
        {order.status === 'separating' &&
          (allChecked ? (
            <Button size="l" block loading={busy} disabled={busy} onClick={() => run(() => markOrderReady(order.id))}>
              Marcar como pronto
            </Button>
          ) : (
            <Button size="l" block disabled>
              <span className={o.num}>Confira os itens · {conf}</span>
            </Button>
          ))}
        {order.status === 'ready' && (
          <>
            <Banner tone="success">
              {order.fulfillment === 'delivery' ? 'Pronto. Aguardando entregador.' : 'Pronto. Aguardando retirada.'}
            </Banner>
            {order.fulfillment === 'delivery' ? (
              <ButtonLink to={`/gestao/entregas/atribuir/${order.id}`} block>
                Atribuir entregador
              </ButtonLink>
            ) : (
              <Button block disabled={busy} onClick={() => run(() => completePickup(order.id))}>
                Cliente retirou
              </Button>
            )}
            <Button variant="secondary" block disabled={busy} onClick={() => run(() => undoOrderReady(order.id))}>
              Desfazer
            </Button>
          </>
        )}
        {order.status === 'en_route' && (
          <ButtonLink to="/gestao/pedidos" variant="secondary" block>
            Voltar aos pedidos
          </ButtonLink>
        )}
      </div>
    </div>
  )
}
