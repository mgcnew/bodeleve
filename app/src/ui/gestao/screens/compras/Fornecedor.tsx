import { Link, useParams } from 'react-router-dom'
import { Box } from '@/components/Card'
import { ButtonLink } from '@/components/Button'
import { EmptyState } from '@/components/Feedback'
import { purchaseTotal } from '@/domain/backoffice'
import { shortDate } from '@/domain/dates'
import { formatCents } from '@/domain/money'
import { entriesStore, itemsStore, purchasesStore, suppliersStore } from '@/services/gestao/backoffice'
import o from '@/styles/ops.module.css'
import { Bar, SumRow } from '../../../shared/OpsBits'
import { purchaseLine } from './shared'

export function Fornecedor() {
  const { id = '' } = useParams()
  const s = suppliersStore.useStore().find((x) => x.id === id)
  const items = itemsStore.useStore().filter((i) => i.supplierId === id)
  const purchases = purchasesStore.useStore().filter((p) => p.supplierId === id)
  const openBills = entriesStore.useStore().filter((e) => e.direction === 'payable' && !e.paidAt && e.counterpart === s?.name)

  if (!s) {
    return (
      <div className={o.screen}>
        <Bar title="Fornecedor" back="/gestao/fornecedores" />
        <EmptyState bare icon="entregas" title="Fornecedor não encontrado" action={<ButtonLink to="/gestao/fornecedores">Ver fornecedores</ButtonLink>} />
      </div>
    )
  }

  const year = new Date().getFullYear()
  const boughtThisYear = purchases.filter((p) => p.receivedAt && new Date(p.receivedAt).getFullYear() === year).reduce((n, p) => n + purchaseTotal(p, 'receivedQty'), 0)
  const last = [...purchases].sort((a, b) => (b.sentAt ?? '').localeCompare(a.sentAt ?? '')).slice(0, 4)

  return (
    <div className={o.screen}>
      <Bar title="Fornecedor" back="/gestao/fornecedores" />
      <main className={`${o.main} ${o.mainTop} ${o.narrow}`}>
        <div>
          <div style={{ font: '700 26px/32px var(--fonte-titulo)' }}>{s.name}</div>
          <div className={o.muted}>
            {s.categories} · fornecedor desde {s.since}
          </div>
        </div>
        <div className={o.card}>
          <div className={o.bold}>Contato</div>
          <div className={`${o.secondary} ${o.num}`}>
            {s.contactName} · {s.phone}
            <br />
            {s.email} · {s.document}
          </div>
        </div>
        <section className={o.section}>
          <h2 className={o.h2}>Produtos que fornece</h2>
          <Box>
            {items.map((i) => (
              <div key={i.id} className={`${o.cardHead} ${o.num}`} style={{ padding: '12px 0', borderBottom: '1px solid var(--linha)' }}>
                <span>{i.name}</span>
                <span className={o.secondary} style={{ whiteSpace: 'nowrap' }}>último custo {formatCents(i.costCents)}</span>
              </div>
            ))}
          </Box>
        </section>
        <div className={o.card}>
          <SumRow label="Pagamento padrão" value={s.paymentTerms} />
          <SumRow label="Prazo de entrega" value={s.leadTime} />
          <SumRow label={`Comprado em ${year}`} value={formatCents(boughtThisYear)} />
          <SumRow label="Contas em aberto" value={openBills.length ? formatCents(openBills.reduce((n, e) => n + e.amountCents, 0)) : 'nenhuma'} />
        </div>
        <section className={o.section}>
          <h2 className={o.h2}>Últimos pedidos</h2>
          <Box>
            {last.map((p) => (
              <Link key={p.id} to={`/gestao/compras/${p.id}`} className={`${o.cardHead} ${o.num}`} style={{ padding: '12px 0', borderBottom: '1px solid var(--linha)', textDecoration: 'none', color: 'inherit' }}>
                <span>
                  <b>{p.number}</b>
                  <span className={o.small} style={{ display: 'block' }}>
                    {purchaseLine(p)} {p.sentAt && !p.receivedAt ? `· enviado ${shortDate(p.sentAt)}` : ''}
                  </span>
                </span>
                <span>{formatCents(purchaseTotal(p, p.receivedAt ? 'receivedQty' : 'qty'))}</span>
              </Link>
            ))}
          </Box>
        </section>
      </main>
      <div className={o.footer}>
        <ButtonLink to={`/gestao/compras/nova?fornecedor=${s.id}`} size="l" block>
          Novo pedido para este fornecedor
        </ButtonLink>
      </div>
    </div>
  )
}
