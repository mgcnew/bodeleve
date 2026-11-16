import { useParams } from 'react-router-dom'
import { Tag } from '@/components/Badges'
import { Box } from '@/components/Card'
import { ButtonLink } from '@/components/Button'
import { EmptyState } from '@/components/Feedback'
import { purchaseTotal } from '@/domain/backoffice'
import { shortDate } from '@/domain/dates'
import { formatCents } from '@/domain/money'
import { purchasesStore, suppliersStore } from '@/services/gestao/backoffice'
import { whatsappLink } from '@/services/gestao/purchases'
import o from '@/styles/ops.module.css'
import { Bar } from '../../../shared/OpsBits'
import { purchaseTag } from './shared'

export function Compra() {
  const { id = '' } = useParams()
  const p = purchasesStore.useStore().find((x) => x.id === id)
  const supplier = suppliersStore.useStore().find((s) => s.id === p?.supplierId)

  if (!p || !supplier) {
    return (
      <div className={o.screen}>
        <Bar title="Pedido de compra" back="/gestao/compras" />
        <EmptyState bare icon="compras" title="Pedido de compra não encontrado" action={<ButtonLink to="/gestao/compras">Ver compras</ButtonLink>} />
      </div>
    )
  }

  const tag = purchaseTag(p)
  const canReceive = p.status === 'sent' || p.status === 'partially_received'
  const received = p.status === 'received' || p.status === 'partially_received'

  return (
    <div className={o.screen}>
      <Bar title={p.number} back="/gestao/compras" />
      <main className={`${o.main} ${o.mainTop} ${o.narrow}`}>
        <div className={o.section} style={{ gap: 6 }}>
          <div>
            <Tag tone={tag.tone}>{tag.label}</Tag>
          </div>
          <div style={{ font: '700 24px/30px var(--fonte-titulo)' }}>{supplier.name}</div>
          <div className={`${o.muted} ${o.num}`}>
            {p.sentAt && `Pedido enviado em ${shortDate(p.sentAt)} pelo WhatsApp · `}
            {p.receivedAt ? `recebido em ${shortDate(p.receivedAt)}` : `previsão ${shortDate(p.expectedAt)}`}
          </div>
        </div>
        <section className={o.section}>
          <h2 className={o.h2}>Itens pedidos</h2>
          <Box>
            {p.items.map((i) => (
              <div key={i.itemId} className={`${o.cardHead} ${o.num}`} style={{ padding: '12px 0', borderBottom: '1px solid var(--linha)', alignItems: 'flex-start' }}>
                <div>
                  <div className={o.bold}>{i.name}</div>
                  <div className={o.small}>
                    {i.qty} un × {formatCents(i.unitCostCents)}
                    {received && ` · chegaram ${i.receivedQty}`}
                  </div>
                </div>
                <div className={o.bold}>{formatCents(i.qty * i.unitCostCents)}</div>
              </div>
            ))}
            <div className={`${o.cardHead} ${o.num}`} style={{ padding: '12px 0', fontWeight: 600, fontSize: 18 }}>
              <span>Total</span>
              <span>{formatCents(purchaseTotal(p))}</span>
            </div>
          </Box>
        </section>
        <div className={o.card}>
          <div className={o.bold}>Pagamento</div>
          <div className={o.secondary}>{p.paymentTerms}. A conta a pagar é criada no recebimento, com o valor do que chegou.</div>
        </div>
      </main>
      <div className={o.footer}>
        {canReceive && supplier.phone && (
          <a
            className={o.linkInline}
            style={{ justifyContent: 'center' }}
            target="_blank"
            rel="noopener noreferrer"
            href={whatsappLink(
              supplier.phone,
              [`Olá, ${supplier.contactName}! Pedido ${p.number} da Bodeleve:`, ...p.items.map((i) => `• ${i.qty} × ${i.name}`), `Previsão: ${new Date(p.expectedAt).toLocaleDateString('pt-BR')}`, `Pagamento: ${p.paymentTerms}`].join('\n'),
            )}
          >
            Enviar pelo WhatsApp
          </a>
        )}
        {canReceive && (
          <ButtonLink to={`/gestao/compras/${p.id}/receber`} size="l" block>
            Receber mercadoria
          </ButtonLink>
        )}
        <ButtonLink to={`/gestao/fornecedores/${supplier.id}`} variant="secondary" block>
          Ver fornecedor
        </ButtonLink>
      </div>
    </div>
  )
}
