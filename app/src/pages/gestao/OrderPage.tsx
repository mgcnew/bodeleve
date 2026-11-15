import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Banner, Button, ButtonLink, EmptyState, Icon, IndicatorSkeleton, StatusTag } from '@/components'
import { addressLine } from '@/domain/checkout'
import { paymentBadge } from '@/domain/orderText'
import { stageOf, type OpenStage } from '@/domain/orders'
import { formatBRL, formatClock, formatDayMonth } from '@/lib/format'
import type { AdminOrder } from '@/services/types'
import { useAdminOrder, useOrderAction } from '@/ui/gestao/queries'
import { Footer, QueryBoundary, ScreenHeader } from '@/ui/loja/parts'
import s from '@/ui/gestao/gestao.module.css'
import l from '@/ui/loja/loja.module.css'

const label: Record<OpenStage, string> = { new: 'Novo', preparing: 'Separando', ready: 'Pronto', on_route: 'Em rota' }
const hint: Record<OpenStage, (o: AdminOrder) => string> = {
  new: (o) => (o.payment.paid ? `Pago no ${o.payment.method === 'pix' ? 'Pix' : 'pedido'}. Aceite para começar a separar.` : 'Aceite para começar a separar.'),
  preparing: () => 'Marque cada item ao colocar na sacola.',
  ready: (o) => (o.fulfillment === 'delivery' ? 'O cliente foi avisado pelo WhatsApp.' : 'O cliente foi avisado pelo WhatsApp para retirar.'),
  on_route: () => 'O entregador está a caminho do cliente.',
}
const order = ['new', 'preparing', 'ready', 'on_route'] as const

function Detail({ o }: { o: AdminOrder }) {
  const navigate = useNavigate()
  const action = useOrderAction(o.id)
  const [checked, setChecked] = useState<Set<string>>(new Set())
  const stage = stageOf(o)
  const total = o.items.length
  const done = o.items.filter((i) => checked.has(i.productId)).length
  const badge = paymentBadge(o)
  const toggle = (id: string) => setChecked((c) => { const n = new Set(c); if (n.has(id)) n.delete(id); else n.add(id); return n })
  const idx = stage ? order.indexOf(stage) : 3
  const busy = action.accept.isPending || action.markReady.isPending || action.undoReady.isPending
  const failed = action.accept.isError || action.markReady.isError || action.undoReady.isError

  return (
    <>
      <ScreenHeader title={`Pedido #${o.id}`} back="/gestao/pedidos" />
      <main className={s.main} style={{ gap: 16, paddingTop: 16 }}>
        <div className={l.stack} style={{ gap: 8 }}>
          <div className={s.progress} aria-hidden="true">
            {[0, 1, 2].map((n) => <span key={n} className={`${s.progressBar} ${n < idx ? s.progressDone : n === idx ? s.progressNow : ''}`} />)}
          </div>
          <div className={l.spread}>
            <span className={l.strong} style={{ fontSize: 18 }}>{stage ? label[stage] : 'Concluído'}</span>
            <span className={l.sub}>Recebido às {formatClock(o.createdAt)}</span>
          </div>
          <div aria-live="polite" className={l.sub}>{stage ? hint[stage](o) : ''}</div>
        </div>

        <section className={l.section} aria-labelledby="itens-t">
          <h2 id="itens-t" className={l.h2}>Itens</h2>
          {stage === 'preparing' ? (
            <>
              <div className={l.linkList}>
                {o.items.map((i) => (
                  <label key={i.productId} className={s.checkRow} htmlFor={`k-${i.productId}`}>
                    <input id={`k-${i.productId}`} type="checkbox" checked={checked.has(i.productId)} onChange={() => toggle(i.productId)} />
                    <span className={l.grow}>
                      <span className={l.optionTitle}>{i.name}</span>
                      <span className={l.optionDetail}>
                        {i.qty} un · {i.unit}{i.lot ? ` · Lote ${i.lot.code}${i.lot.expiresAt ? ` · vence ${formatDayMonth(i.lot.expiresAt)}` : ''}` : ''}
                      </span>
                    </span>
                    <span className={l.price}>{formatBRL(i.unitPriceCents * i.qty)}</span>
                  </label>
                ))}
              </div>
              <div className={l.sub}>{done} de {total} conferidos</div>
            </>
          ) : (
            <div className={l.linkList}>
              {o.items.map((i) => (
                <div key={i.productId} className={s.plainRow}>
                  <span className={l.grow}>
                    <span className={l.optionTitle}>{i.name}</span>
                    <span className={l.optionDetail}>{i.qty} un · {i.unit}</span>
                  </span>
                  <span className={l.price}>{formatBRL(i.unitPriceCents * i.qty)}</span>
                </div>
              ))}
            </div>
          )}
          <div className={l.card} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div className={l.sumRow}><span>Subtotal</span><span>{formatBRL(o.subtotalCents)}</span></div>
            <div className={l.sumRow}><span>Entrega</span><span>{o.fulfillment === 'delivery' ? formatBRL(o.deliveryFeeCents) : 'Grátis'}</span></div>
            <div className={`${l.sumRow} ${l.sumTotal}`}><span>Total</span><span>{formatBRL(o.totalCents)}</span></div>
            <div><StatusTag tone={badge.tone}>{badge.label}</StatusTag></div>
          </div>
        </section>

        <section className={l.section} aria-labelledby="cli-t">
          <h2 id="cli-t" className={l.h2}>Cliente e entrega</h2>
          <div className={l.card} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div>
              <div className={l.strong}>{o.contact.name}</div>
              <div className={l.sub}>
                {o.contact.phone}
                {o.customerSince ? ` · cliente desde ${o.customerSince}` : ''} · {o.customerOrderCount} {o.customerOrderCount === 1 ? 'pedido' : 'pedidos'}
              </div>
            </div>
            <div className={l.cardRow}>
              <Icon name="local" size={20} />
              <div>
                {o.fulfillment === 'delivery' && o.address ? (
                  <>
                    <div>{addressLine(o.address)}</div>
                    <div className={l.sub}>{o.address.district} · {o.window.label}</div>
                  </>
                ) : (
                  <>
                    <div>Retirada na loja</div>
                    <div className={l.sub}>{o.window.label}</div>
                  </>
                )}
              </div>
            </div>
          </div>
        </section>
        {failed && <Banner tone="error">Não foi possível atualizar o pedido. Nada foi alterado. Tente de novo.</Banner>}
      </main>

      <Footer>
        {stage === 'new' && (
          <Button size="lg" fullWidth loading={action.accept.isPending} onClick={() => action.accept.mutate()}>
            {action.accept.isPending ? 'Aceitando…' : 'Aceitar e começar a separar'}
          </Button>
        )}
        {stage === 'preparing' &&
          (done === total ? (
            <Button size="lg" fullWidth loading={action.markReady.isPending} onClick={() => action.markReady.mutate([...checked])}>
              {action.markReady.isPending ? 'Marcando…' : 'Marcar como pronto'}
            </Button>
          ) : (
            <Button size="lg" fullWidth disabled>Confira os itens · {done} de {total} conferidos</Button>
          ))}
        {stage === 'ready' && (
          <>
            <Banner tone="success">{o.fulfillment === 'delivery' ? 'Pronto. Aguardando entregador.' : 'Pronto. Aguardando retirada.'}</Banner>
            <ButtonLink href="/gestao/pedidos" variant="secondary" fullWidth>Voltar aos pedidos</ButtonLink>
            <Button variant="ghost" fullWidth disabled={busy} loading={action.undoReady.isPending} onClick={() => { setChecked(new Set()); action.undoReady.mutate() }}>Desfazer</Button>
          </>
        )}
        {(stage === 'on_route' || stage === null) && <Button size="lg" fullWidth variant="secondary" onClick={() => navigate('/gestao/pedidos')}>Voltar aos pedidos</Button>}
      </Footer>
    </>
  )
}

export function AdminOrderPage() {
  const { id } = useParams()
  const query = useAdminOrder(id)
  return (
    <QueryBoundary query={query} skeleton={<><ScreenHeader back="/gestao/pedidos" /><main className={s.main}><IndicatorSkeleton label="Carregando pedido" /></main></>} errorTitle="Não foi possível carregar o pedido">
      {(o) =>
        o ? <Detail key={`${o.id}-${o.status}`} o={o} /> : (
          <>
            <ScreenHeader back="/gestao/pedidos" />
            <main className={s.main}>
              <EmptyState icon="pedidos" title="Pedido não encontrado" description="Ele pode ter sido concluído ou ainda não chegou." action={<ButtonLink href="/gestao/pedidos">Ver pedidos</ButtonLink>} />
            </main>
          </>
        )
      }
    </QueryBoundary>
  )
}
