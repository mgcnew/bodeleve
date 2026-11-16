import { useEffect } from 'react'
import { useLocation, useParams } from 'react-router-dom'
import { ButtonLink } from '@/components/Button'
import { Panel, SummaryRow, SummaryTotal } from '@/components/Card'
import { EmptyState, Skeleton } from '@/components/Feedback'
import { Icon } from '@/components/Icon'
import { plural } from '@/domain/catalog'
import { formatCents } from '@/domain/money'
import { formatTime, itemCount, orderTotal, subtotal } from '@/domain/order'
import { useAsync } from '@/lib/useAsync'
import { getOrder } from '@/services/orders'
import { DeliveryCode, OrderTimeline } from '../../components/Checkout'
import { useCart } from '../../state/cart'
import l from '../../loja.module.css'
import s from './Pedidos.module.css'

export function Confirmado() {
  const { id = '' } = useParams()
  const order = useAsync(() => getOrder(id), [id])
  const { clear } = useCart()
  const placed = (useLocation().state as { placed?: boolean } | null)?.placed

  useEffect(() => {
    if (placed) clear()
  }, [placed, clear])

  if (order.status !== 'ready') {
    return (
      <div className={`${l.screen} ${l.narrow}`}>
        <main role="status" aria-label="Carregando pedido" className={l.main} style={{ paddingTop: 40, alignItems: 'center' }}>
          <Skeleton width="72px" height={72} radius={999} />
          <Skeleton width="60%" height={28} />
        </main>
      </div>
    )
  }

  const o = order.data
  if (!o) {
    return (
      <div className={`${l.screen} ${l.narrow}`}>
        <EmptyState bare icon="pedidos" title="Pedido não encontrado" action={<ButtonLink to="/pedidos">Ver meus pedidos</ButtonLink>} />
      </div>
    )
  }

  const delivery = o.fulfillment === 'delivery'

  return (
    <div className={`${l.screen} ${l.narrow}`}>
      <main className={l.main} style={{ gap: 20, paddingTop: 40 }}>
        <div className={s.success}>
          <div aria-hidden="true" className={s.check}>
            <Icon name="confirmar" size={36} />
          </div>
          <h1 className={l.pageTitle}>Pedido confirmado</h1>
          <div className={`${l.secondary} ${l.num}`}>
            Pedido {o.number} ·{' '}
            {delivery && o.estimatedAt ? `previsão de entrega às ${formatTime(o.estimatedAt)}` : 'avisamos pelo WhatsApp quando estiver pronto'}
          </div>
        </div>

        {/* H-L4 — código de 4 dígitos exibido na confirmação */}
        {delivery && <DeliveryCode code={o.deliveryCode} />}

        {o.payment === 'pix' && (
          <Panel title="Pague com Pix">
            <div className={s.pix}>
              <div role="img" aria-label="Espaço para o QR Code Pix" className={s.qr}>
                [QR CODE PIX]
              </div>
              <p className={l.muted}>Leia o código no app do banco. O pedido começa a ser preparado quando o pagamento for confirmado.</p>
            </div>
          </Panel>
        )}

        <Panel>
          <OrderTimeline order={o} />
        </Panel>

        <Panel title="Resumo">
          <SummaryRow label={plural(itemCount(o.items), 'item', 'itens')} value={formatCents(subtotal(o.items))} />
          <SummaryRow label={delivery ? 'Entrega' : 'Retirada na loja'} value={o.feeCents ? formatCents(o.feeCents) : 'Grátis'} />
          <SummaryTotal value={formatCents(orderTotal(o))} />
        </Panel>
      </main>
      <div className={`${l.footer} ${l.footerPlain}`}>
        <ButtonLink to={`/pedidos/${o.id}`} size="l" block>
          Acompanhar pedido
        </ButtonLink>
        <ButtonLink to="/" variant="secondary" block>
          Voltar ao início
        </ButtonLink>
      </div>
    </div>
  )
}
