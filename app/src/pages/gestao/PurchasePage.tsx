import { useParams } from 'react-router-dom'
import { ButtonLink, EmptyState, IndicatorSkeleton, StatusTag } from '@/components'
import { isOpen, paymentTerms } from '@/domain/purchasing'
import { formatBRL, formatDayMonth } from '@/lib/format'
import { usePurchase } from '@/ui/gestao/queries'
import { Footer, QueryBoundary, ScreenHeader } from '@/ui/loja/parts'
import { purchaseLabel } from './purchasing'
import s from '@/ui/gestao/gestao.module.css'
import l from '@/ui/loja/loja.module.css'

export function PurchasePage() {
  const { id } = useParams()
  const query = usePurchase(id)
  return (
    <QueryBoundary query={query} skeleton={<><ScreenHeader back="/gestao/compras" /><main className={s.main}><IndicatorSkeleton label="Carregando pedido de compra" /></main></>} errorTitle="Não foi possível carregar o pedido">
      {(o) =>
        !o ? (
          <>
            <ScreenHeader back="/gestao/compras" />
            <main className={s.main}><EmptyState icon="compras" title="Pedido de compra não encontrado" action={<ButtonLink href="/gestao/compras">Ver compras</ButtonLink>} /></main>
          </>
        ) : (
          <>
            <ScreenHeader title={o.id} back="/gestao/compras" />
            <main className={s.main} style={{ gap: 16, paddingTop: 16 }}>
              {(() => {
                const t = purchaseLabel(o)
                return (
                  <div className={l.stack} style={{ gap: 6 }}>
                    <div><StatusTag tone={t.tone}>{t.tag}</StatusTag></div>
                    <div className={l.h1} style={{ fontSize: 22 }}>{o.supplierName}</div>
                    <div className={l.sub}>
                      {o.sentVia === 'whatsapp'
                        ? `Pedido enviado em ${formatDayMonth(o.sentAt!)} pelo WhatsApp`
                        : `Pedido registrado como enviado em ${formatDayMonth(o.sentAt!)}. A mensagem foi guardada, mas não enviada nesta versão`}
                      {isOpen(o) ? ` · previsão ${formatDayMonth(o.expectedAt)}` : o.receivedAt ? ` · recebido ${formatDayMonth(o.receivedAt)}` : ''}
                    </div>
                  </div>
                )
              })()}

              <section className={l.section} aria-labelledby="itens-t">
                <h2 id="itens-t" className={l.h2}>Itens pedidos</h2>
                <div className={l.linkList}>
                  {o.items.map((i) => (
                    <div key={i.itemId} className={l.spread} style={{ padding: '12px 0', borderTop: '1px solid var(--linha)', alignItems: 'flex-start' }}>
                      <div>
                        <div className={l.strong}>{i.name}</div>
                        <div className={`${l.small} ${l.tabular}`}>
                          {i.qty} un × {formatBRL(i.unitCostCents)}
                          {o.status !== 'sent' && i.receivedQty !== i.qty ? ` · recebido ${i.receivedQty}` : ''}
                        </div>
                      </div>
                      <div className={`${l.strong} ${l.tabular}`}>{formatBRL(i.qty * i.unitCostCents)}</div>
                    </div>
                  ))}
                  <div className={`${l.spread} ${l.strong} ${l.tabular}`} style={{ padding: '12px 0', borderTop: '1px solid var(--linha)' }}>
                    <span>Total</span><span>{formatBRL(o.totalCents)}</span>
                  </div>
                  {o.status === 'received' && o.receivedCents !== o.totalCents && (
                    <div className={`${l.spread} ${l.sub} ${l.tabular}`} style={{ padding: '0 0 12px' }}>
                      <span>Valor do que chegou</span><span>{formatBRL(o.receivedCents)}</span>
                    </div>
                  )}
                </div>
              </section>

              <div className={l.card} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div className={l.strong}>Pagamento</div>
                <div className={l.sub}>{paymentTerms[o.payment].label}. A conta a pagar é criada no recebimento, com o valor do que chegou.</div>
              </div>
            </main>
            <Footer>
              {isOpen(o) && <ButtonLink href={`/gestao/compras/${o.id}/receber`} size="lg" fullWidth>Receber mercadoria</ButtonLink>}
              <ButtonLink href={`/gestao/fornecedores/${o.supplierId}`} variant={isOpen(o) ? 'secondary' : 'primary'} fullWidth>Ver fornecedor</ButtonLink>
            </Footer>
          </>
        )
      }
    </QueryBoundary>
  )
}
