import { useNavigate, useParams } from 'react-router-dom'
import { Banner, Button, ButtonLink, EmptyState, IndicatorSkeleton, OrderTimeline, StatusTag } from '@/components'
import { paymentLabel } from '@/config/storefront'
import { itemsLabel } from '@/domain/bag'
import { addressLine } from '@/domain/checkout'
import { buildTimeline, isInProgress, statusLabel, statusTone } from '@/domain/orders'
import type { Order } from '@/domain/types'
import { formatBRL, formatFullDate } from '@/lib/format'
import { useBag } from '@/store/bag'
import { useAllProducts, useOrder, useStoreContent } from '@/ui/loja/queries'
import { Footer, QueryBoundary, ScreenHeader } from '@/ui/loja/parts'
import s from '@/ui/loja/loja.module.css'

function Tracking({ order }: { order: Order }) {
  const content = useStoreContent()
  const delivery = order.fulfillment === 'delivery'
  const lead = order.status === 'out_for_delivery' ? 'Seu pedido saiu para entrega.' : order.status === 'received' ? 'Recebemos seu pedido.' : order.status === 'ready_for_pickup' ? 'Seu pedido está pronto para retirada.' : 'A casa está separando seus itens.'
  return (
    <>
      <ScreenHeader title={`Pedido ${order.id}`} back="/pedidos" />
      <main className={`${s.main} ${s.narrow}`} style={{ gap: 16 }}>
        <div className={s.card} style={{ padding: 20, background: 'var(--cor-terracota-suave)', borderColor: 'var(--cor-terracota-suave)', display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div className={s.sub} style={{ color: 'var(--cor-terracota-pressionado)' }}>{delivery ? 'Previsão de entrega' : 'Retirada'}</div>
          <div className={s.etaTitle}>{order.etaLabel ?? order.window.detail}</div>
          <div>{lead}</div>
        </div>
        {delivery && (
          <div className={`${s.card} ${s.cardLg} ${s.spread}`}>
            <div>
              <div className={s.strong}>Código de entrega</div>
              <div className={s.sub}>Informe ao entregador ao receber.</div>
            </div>
            <div className={s.codeBox} aria-label={`Código ${order.deliveryCode.split('').join(' ')}`}>{order.deliveryCode}</div>
          </div>
        )}
        <OrderTimeline steps={buildTimeline(order).map((t) => ({ label: t.label, detail: t.detail, state: t.state }))} />
        <div className={s.card} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div className={s.strong}>{delivery ? 'Entrega' : 'Retirada'}</div>
          <div className={s.sub}>{delivery && order.address ? `${addressLine(order.address)} — ${order.address.district}` : `Bodeleve · ${content.data?.address ?? ''}`}</div>
        </div>
        <div className={`${s.card} ${s.cardLg}`} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div className={s.strong}>Resumo</div>
          {order.items.map((i) => (
            <div key={i.productId} className={`${s.sumRow}`}><span>{i.qty} × {i.name}</span><span>{formatBRL(i.unitPriceCents * i.qty)}</span></div>
          ))}
          <div className={s.sumRow}><span>Entrega</span><span>{delivery ? formatBRL(order.deliveryFeeCents) : 'Grátis'}</span></div>
          <div className={`${s.sumRow} ${s.sumTotal}`}><span>Total · {paymentLabel[order.payment.method]}</span><span>{formatBRL(order.totalCents)}</span></div>
        </div>
        <div className={s.sub}>Precisa de ajuda? Fale com a loja: {content.data?.whatsapp}</div>
      </main>
    </>
  )
}

function Detail({ order }: { order: Order }) {
  const navigate = useNavigate()
  const add = useBag((b) => b.add)
  const products = useAllProducts()
  const delivery = order.fulfillment === 'delivery'
  const availability = (id: string) => products.data?.find((p) => p.id === id)?.available ?? true
  const unavailable = order.items.filter((i) => !availability(i.productId))
  const available = order.items.filter((i) => availability(i.productId))
  const finishedAt = order.stepTimes[order.status]
  const reorder = () => {
    // H-L13: o que está indisponível fica de fora; o resto soma ao que já estiver na sacola.
    available.forEach((i) => add(i.productId, i.qty))
    navigate('/sacola')
  }
  const reorderCount = available.reduce((a, i) => a + i.qty, 0)
  return (
    <>
      <ScreenHeader title={`Pedido ${order.id}`} back="/pedidos" />
      <main className={`${s.main} ${s.narrow}`} style={{ gap: 16 }}>
        <div className={s.chips} style={{ alignItems: 'center', gap: 10 }}>
          <StatusTag tone={statusTone(order.status)}>{statusLabel[order.status]}</StatusTag>
          <span className={s.sub}>{formatFullDate(order.createdAt)}{finishedAt ? `, às ${finishedAt}` : ''}</span>
        </div>
        <div className={s.linkList}>
          {order.items.map((i) => (
            <div key={i.productId} className={s.spread} style={{ padding: '12px 0', borderTop: '1px solid var(--linha)' }}>
              <div>
                <div className={s.strong}>{i.qty} × {i.name}</div>
                {!availability(i.productId) && <StatusTag tone="warning">Indisponível hoje</StatusTag>}
              </div>
              <div className={`${s.strong} ${s.tabular}`}>{formatBRL(i.unitPriceCents * i.qty)}</div>
            </div>
          ))}
          <div className={`${s.spread} ${s.sub} ${s.tabular}`} style={{ padding: '12px 0', borderTop: '1px solid var(--linha)' }}><span>Entrega</span><span>{delivery ? formatBRL(order.deliveryFeeCents) : 'Grátis'}</span></div>
          <div className={`${s.spread} ${s.strong} ${s.tabular}`} style={{ padding: '12px 0', borderTop: '1px solid var(--linha)' }}><span>Total</span><span>{formatBRL(order.totalCents)}</span></div>
        </div>
        {unavailable.length > 0 && (
          <Banner tone="warning">
            {unavailable.length === 1 ? '1 item está indisponível hoje e fica fora do novo pedido.' : `${unavailable.length} itens estão indisponíveis hoje e ficam fora do novo pedido.`}
          </Banner>
        )}
      </main>
      <Footer>
        <Button size="lg" fullWidth disabled={available.length === 0} onClick={reorder}>Pedir de novo · {itemsLabel(reorderCount)}</Button>
        <div className={s.small} style={{ textAlign: 'center' }}>Você confere tudo na sacola antes de pagar.</div>
      </Footer>
    </>
  )
}

/** Pedido em andamento mostra o acompanhamento; pedido concluído mostra o detalhe com "pedir de novo". */
export function OrderPage() {
  const { id } = useParams()
  const query = useOrder(id)
  return (
    <QueryBoundary query={query} skeleton={<><ScreenHeader back="/pedidos" /><main className={s.main}><IndicatorSkeleton label="Carregando pedido" /></main></>} errorTitle="Não foi possível carregar o pedido">
      {(order) =>
        !order ? (
          <>
            <ScreenHeader back="/pedidos" />
            <main className={s.main}>
              <EmptyState icon="pedidos" title="Pedido não encontrado" description="Ele pode ter sido feito em outro aparelho. Entre na sua conta para ver todos." action={<ButtonLink href="/pedidos">Ver meus pedidos</ButtonLink>} />
            </main>
          </>
        ) : isInProgress(order) ? (
          <Tracking order={order} />
        ) : (
          <Detail order={order} />
        )
      }
    </QueryBoundary>
  )
}
