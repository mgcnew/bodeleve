import { useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Tag } from '@/components/Badges'
import { Box, Panel, SummaryRow, SummaryTotal } from '@/components/Card'
import { Button, ButtonLink } from '@/components/Button'
import { Banner, EmptyState, ErrorState, Skeleton } from '@/components/Feedback'
import { formatCents } from '@/domain/money'
import { formatAddress, formatTime, isFinished, orderTotal, paymentLabels, type Order } from '@/domain/order'
import { useAsync } from '@/lib/useAsync'
import { useEstablishment } from '../../state/storeInfo'
import { availableForReorder, getOrder } from '@/services/orders'
import { listProducts } from '@/services/catalog'
import { TopBar } from '../../components/LojaShell'
import { DeliveryCode, OrderTimeline } from '../../components/Checkout'
import { useCart } from '../../state/cart'
import l from '../../loja.module.css'
import s from './Pedidos.module.css'
import { etaText, statusTag } from './shared'

/** Em andamento → acompanhamento; concluído → detalhe e recompra */
export function Pedido() {
  const { id = '' } = useParams()
  const order = useAsync(() => getOrder(id), [id])
  const { reload } = order
  const running = order.status === 'ready' && !!order.data && !isFinished(order.data.status)

  // sem Realtime ainda: pedido em andamento se atualiza sozinho a cada 15 s
  useEffect(() => {
    if (!running) return
    const t = setInterval(reload, 15_000)
    return () => clearInterval(t)
  }, [running, reload])

  const title = order.status === 'ready' && order.data ? `Pedido ${order.data.number}` : 'Pedido'
  return (
    <div className={`${l.screen} ${l.narrow}`}>
      <TopBar title={title} back="/pedidos" cart={false} />
      {order.status === 'loading' && (
        <main role="status" aria-label="Carregando pedido" className={`${l.main} ${l.mainTight}`}>
          <Skeleton width="100%" height={120} radius={20} />
          <Skeleton width="100%" height={180} radius={12} />
        </main>
      )}
      {order.status === 'error' && (
        <main className={l.main}>
          <ErrorState
            title="Não foi possível carregar o pedido"
            text="Verifique a conexão e tente de novo."
            action={<Button onClick={order.retry}>Tentar de novo</Button>}
          />
        </main>
      )}
      {order.status === 'ready' &&
        (order.data === null ? (
          <EmptyState bare icon="pedidos" title="Pedido não encontrado" action={<ButtonLink to="/pedidos">Ver meus pedidos</ButtonLink>} />
        ) : isFinished(order.data.status) ? (
          <Detalhe order={order.data} />
        ) : (
          <Acompanhamento order={order.data} />
        ))}
    </div>
  )
}

function Acompanhamento({ order }: { order: Order }) {
  const establishment = useEstablishment()
  const delivery = order.fulfillment === 'delivery'
  const addr = order.address && formatAddress(order.address)
  return (
    <main className={`${l.main} ${l.mainTight}`}>
      <div className={s.eta}>
        <div style={{ font: 'var(--apoio)' }}>{delivery ? 'Previsão de entrega' : 'Retirada'}</div>
        <div className={s.etaValue}>
          {order.estimatedAt ? `Hoje, ${formatTime(order.estimatedAt)}` : (order.etaLabel ?? order.windowLabel.split(' · ')[0])}
        </div>
        <div style={{ font: '400 15px/22px var(--fonte-texto)' }}>{etaText(order)}</div>
      </div>
      {delivery && <DeliveryCode code={order.deliveryCode} />}
      <Panel>
        <OrderTimeline order={order} highlightCurrent />
      </Panel>
      <Panel title={delivery ? 'Entrega' : 'Retirada'}>
        <div className={l.secondary}>
          {delivery && addr ? `${addr.line1} — ${addr.line2}` : `${establishment.name} · ${establishment.address}`}
        </div>
      </Panel>
      <Panel title="Resumo">
        {order.items.map((i) => (
          <SummaryRow key={i.productId} label={`${i.quantity} × ${i.name}`} value={formatCents(i.quantity * i.unitPriceCents)} />
        ))}
        <SummaryRow label={delivery ? 'Entrega' : 'Retirada na loja'} value={order.feeCents ? formatCents(order.feeCents) : 'Grátis'} />
        <div className={l.num} style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 8, borderTop: '1px solid var(--linha)', fontWeight: 600 }}>
          <span>Total · {paymentLabels[order.payment]}</span>
          <span>{formatCents(orderTotal(order))}</span>
        </div>
      </Panel>
      <p className={l.muted}>Precisa de ajuda? Fale com a loja: {establishment.whatsapp}</p>
    </main>
  )
}

function Detalhe({ order }: { order: Order }) {
  const { add } = useCart()
  const navigate = useNavigate()
  const tag = statusTag[order.status]
  const catalog = useAsync(() => listProducts(), [])
  const lines = availableForReorder(order, catalog.status === 'ready' ? catalog.data : [])
  const available = lines.filter((li) => li.product)
  const missing = lines.length - available.length
  const date = new Date(order.createdAt)

  // H-L13 — "Pedir de novo" deixa de fora itens indisponíveis e avisa antes
  const reorder = () => {
    for (const { item, product } of available) if (product) add(product, item.quantity)
    navigate('/sacola')
  }

  return (
    <>
      <main className={`${l.main} ${l.mainTight}`}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Tag tone={tag.tone}>{tag.label}</Tag>
          <span className={`${l.muted} ${l.num}`}>
            {date.toLocaleDateString('pt-BR')}, às {formatTime(order.createdAt)}
          </span>
        </div>
        <Box>
          {lines.map(({ item, product }) => (
            <div key={item.productId} className={s.line}>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 600, color: product ? undefined : 'var(--texto-secundario)' }}>
                  {item.quantity} × {item.name}
                </div>
                {!product && <Tag tone="warning">Indisponível hoje</Tag>}
              </div>
              <div className={l.secondary}>{formatCents(item.quantity * item.unitPriceCents)}</div>
            </div>
          ))}
          <div style={{ padding: '4px 0' }}>
            <SummaryRow label={order.fulfillment === 'delivery' ? 'Entrega' : 'Retirada na loja'} value={order.feeCents ? formatCents(order.feeCents) : 'Grátis'} />
          </div>
          <div style={{ paddingBottom: 12 }}>
            <SummaryTotal value={formatCents(orderTotal(order))} />
          </div>
        </Box>
        {missing > 0 && (
          <Banner tone="warning">
            {missing === 1 ? '1 item está indisponível hoje e fica fora' : `${missing} itens estão indisponíveis hoje e ficam fora`} do novo pedido.
          </Banner>
        )}
      </main>
      {available.length > 0 && (
        <div className={l.footer}>
          <Button size="l" block onClick={reorder}>
            Pedir de novo · {available.reduce((n, li) => n + li.item.quantity, 0) === 1 ? '1 item' : `${available.reduce((n, li) => n + li.item.quantity, 0)} itens`}
          </Button>
          <p className={`${l.muted} ${l.center}`}>Você confere tudo na sacola antes de pagar.</p>
        </div>
      )}
    </>
  )
}
