import { useParams } from 'react-router-dom'
import { ButtonLink, Icon, IndicatorSkeleton, OrderTimeline } from '@/components'
import { storefront } from '@/config/storefront'
import { buildTimeline } from '@/domain/orders'
import { formatBRL, lowerFirst } from '@/lib/format'
import { itemsLabel } from '@/domain/bag'
import { useOrder } from '@/ui/loja/queries'
import { QueryBoundary } from '@/ui/loja/parts'
import s from '@/ui/loja/loja.module.css'

export function ConfirmedPage() {
  const { id } = useParams()
  const query = useOrder(id)
  return (
    <QueryBoundary query={query} skeleton={<main className={s.main}><IndicatorSkeleton label="Carregando pedido" /></main>}>
      {(order) =>
        !order ? (
          <main className={s.centerBox}>
            <h1 className={s.h1}>Pedido não encontrado</h1>
            <ButtonLink href="/">Voltar ao início</ButtonLink>
          </main>
        ) : (
          <>
            <main className={`${s.main} ${s.narrow}`} style={{ paddingTop: 40 }}>
              <div className={s.stack} style={{ alignItems: 'center', gap: 10, textAlign: 'center' }}>
                <div className={s.disc} style={{ width: 72, height: 72, background: 'var(--sucesso-fundo)', color: 'var(--sucesso)' }} aria-hidden="true">
                  <Icon name="confirmar" size={36} />
                </div>
                <h1 className={s.h1} style={{ fontSize: 28, lineHeight: '34px' }}>Pedido confirmado</h1>
                <div className={s.sub}>Pedido {order.id} · {order.fulfillment === 'delivery' ? 'previsão' : 'retirada'}: {lowerFirst(order.window.detail)}</div>
              </div>

              {order.payment.method === 'pix' && (
                <section className={`${s.card} ${s.cardLg}`} style={{ display: 'flex', flexDirection: 'column', gap: 10 }} aria-labelledby="pix-t">
                  <h2 id="pix-t" className={s.strong}>Pagar com Pix</h2>
                  <div role="img" aria-label="Espaço para o QR Code do Pix" className={s.photoHouse} style={{ height: 160 }}>[QR CODE PIX]</div>
                  <div className={s.sub}>
                    {storefront.pixProviderConnected
                      ? 'Use o QR Code ou o código copia e cola para pagar.'
                      : 'O pagamento por Pix ainda não está ligado nesta versão. Nada foi cobrado.'}
                  </div>
                </section>
              )}

              {order.fulfillment === 'delivery' && (
                <div className={`${s.card} ${s.cardLg} ${s.spread}`}>
                  <div>
                    <div className={s.strong}>Código de entrega</div>
                    <div className={s.sub}>Informe ao entregador ao receber.</div>
                  </div>
                  <div className={s.codeBox} aria-label={`Código ${order.deliveryCode.split('').join(' ')}`}>{order.deliveryCode}</div>
                </div>
              )}

              <OrderTimeline steps={buildTimeline(order).map((t) => ({ label: t.label, detail: t.detail, state: t.state }))} />

              <div className={`${s.card} ${s.cardLg}`} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div className={s.strong}>Resumo</div>
                <div className={s.sumRow}><span>{itemsLabel(order.items.reduce((a, i) => a + i.qty, 0))}</span><span>{formatBRL(order.subtotalCents)}</span></div>
                <div className={s.sumRow}><span>Entrega</span><span>{order.fulfillment === 'delivery' ? formatBRL(order.deliveryFeeCents) : 'Grátis'}</span></div>
                <div className={`${s.sumRow} ${s.sumTotal}`}><span>Total</span><span>{formatBRL(order.totalCents)}</span></div>
              </div>
            </main>
            <div className={s.footer}>
              <div className={s.footerInner}>
                <ButtonLink href={`/pedidos/${order.id}`} size="lg" fullWidth>Acompanhar pedido</ButtonLink>
                <ButtonLink href="/" variant="ghost" fullWidth>Voltar ao início</ButtonLink>
              </div>
            </div>
          </>
        )
      }
    </QueryBoundary>
  )
}
