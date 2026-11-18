import { useState } from 'react'
import { Tag } from '@/components/Badges'
import { Box } from '@/components/Card'
import { EmptyState } from '@/components/Feedback'
import { FilterChips } from '@/components/Field'
import { daysUntil, shortDate } from '@/domain/dates'
import type { FinancialEntry } from '@/domain/backoffice'
import { formatCents } from '@/domain/money'
import { entriesStore } from '@/services/gestao/backoffice'
import { openEntries, overdueDays, remaining } from '@/services/gestao/finance'
import o from '@/styles/ops.module.css'
import { Bar, ListRow } from '../../../shared/OpsBits'

type Tab = 'payable' | 'receivable'

function group(e: FinancialEntry, tab: Tab) {
  const d = daysUntil(e.dueDate)
  if (tab === 'payable') return d < 0 ? 'Atrasadas' : d === 0 ? 'Hoje' : 'Próximos dias'
  return d <= 7 ? 'Esta semana' : 'Mais tarde'
}

function sub(e: FinancialEntry) {
  const kind = e.recurring ? 'Despesa fixa' : e.origin === 'compra' ? 'Compra' : e.origin === 'venda' ? 'Vendas' : 'Lançamento'
  const d = daysUntil(e.dueDate)
  if (e.direction === 'payable') {
    if (d < 0) return `${kind} · venceu ${shortDate(e.dueDate)}`
    return `${kind}${e.ref ? ` · ${e.ref}` : ''} · ${d === 0 ? 'hoje' : shortDate(e.dueDate)}`
  }
  return `${e.counterpart === 'Maquininha' ? 'Liquidação' : 'Combinado'} · ${shortDate(e.dueDate)}`
}

export function Contas() {
  const entries = entriesStore.useStore()
  const [tab, setTab] = useState<Tab>('payable')
  const pay = openEntries(entries, 'payable')
  const rec = openEntries(entries, 'receivable')
  const sum = (l: FinancialEntry[]) => l.reduce((n, e) => n + remaining(e), 0)
  const list = tab === 'payable' ? pay : rec
  const order = tab === 'payable' ? ['Atrasadas', 'Hoje', 'Próximos dias'] : ['Esta semana', 'Mais tarde']

  return (
    <div className={o.screen}>
      <Bar title="Contas" back="/gestao/financeiro" />
      <main className={`${o.main} ${o.mainTop} ${o.narrow}`}>
        <FilterChips
          label="Tipo de conta"
          value={tab}
          onChange={setTab}
          options={[
            { value: 'payable', label: `A pagar · ${formatCents(sum(pay))}` },
            { value: 'receivable', label: `A receber · ${formatCents(sum(rec))}` },
          ]}
        />
        {list.length === 0 ? (
          <EmptyState icon="financeiro" title="Nada em aberto" text={tab === 'payable' ? 'Não há contas a pagar.' : 'Não há valores a receber.'} />
        ) : (
          order.map((g) => {
            const rows = list.filter((e) => group(e, tab) === g)
            if (rows.length === 0) return null
            return (
              <section key={g} className={o.section}>
                <h2 className={o.caps}>{g}</h2>
                <Box>
                  {rows.map((e) => (
                    <ListRow
                      key={e.id}
                      title={e.recurring || e.origin !== 'compra' ? e.description : e.counterpart}
                      sub={sub(e)}
                      to={`/gestao/financeiro/contas/${e.id}`}
                      end={
                        <>
                          <b style={{ color: g === 'Atrasadas' ? 'var(--erro)' : undefined }}>{formatCents(remaining(e))}</b>
                          {overdueDays(e) > 0 ? <Tag tone="error">Atrasado</Tag> : daysUntil(e.dueDate) === 0 && tab === 'payable' ? <Tag tone="warning">Vence hoje</Tag> : e.origin === 'venda' && e.counterpart !== 'Maquininha' ? <Tag tone="info">A prazo</Tag> : null}
                        </>
                      }
                    />
                  ))}
                </Box>
              </section>
            )
          })
        )}
        {/* H-G22/H-G24 — despesas fixas se repetem; cartão a liquidar e fiado são contas a receber */}
        <p className={o.muted}>Contas de compra nascem no recebimento da mercadoria. Despesas fixas se repetem todo mês.</p>
      </main>
    </div>
  )
}
