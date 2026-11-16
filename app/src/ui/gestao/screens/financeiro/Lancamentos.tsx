import { useState } from 'react'
import { Box } from '@/components/Card'
import { EmptyState } from '@/components/Feedback'
import { FilterChips } from '@/components/Field'
import { Icon } from '@/components/Icon'
import { hourMinute, isTodayIso, shortDate } from '@/domain/dates'
import { formatCents } from '@/domain/money'
import { ledgerStore } from '@/services/gestao/backoffice'
import o from '@/styles/ops.module.css'
import { Bar, SumRow } from '../../../shared/OpsBits'
import s from '../estoque/Estoque.module.css'

type Filter = 'all' | 'in' | 'out'

export function Lancamentos() {
  const ledger = ledgerStore.useStore()
  const [filter, setFilter] = useState<Filter>('all')
  // a transferência tem duas pontas; mostra só a que sai
  const shown = ledger.filter((t) => !(t.kind === 'transfer' && t.amountCents > 0)).sort((a, b) => b.at.localeCompare(a.at))
  const visible = shown.filter((t) => filter === 'all' || (filter === 'in' ? t.kind === 'in' : t.kind === 'out'))
  const ins = ledger.filter((t) => t.kind === 'in').reduce((n, t) => n + t.amountCents, 0)
  const outs = ledger.filter((t) => t.kind === 'out').reduce((n, t) => n + t.amountCents, 0)

  return (
    <div className={o.screen}>
      <Bar title="Lançamentos" back="/gestao/financeiro" />
      <main className={`${o.main} ${o.mainTop} ${o.narrow}`}>
        <FilterChips
          label="Filtrar lançamentos"
          value={filter}
          onChange={setFilter}
          options={[
            { value: 'all', label: 'Todos' },
            { value: 'in', label: 'Entradas' },
            { value: 'out', label: 'Saídas' },
          ]}
        />
        {visible.length === 0 ? (
          <EmptyState icon="financeiro" title="Nenhum lançamento" text="Vendas, compras e pagamentos aparecem aqui." />
        ) : (
          <Box>
            {visible.map((t) => {
              const entry = t.kind === 'in'
              const transfer = t.kind === 'transfer'
              return (
                <div key={t.id} className={s.mv} style={{ alignItems: 'center' }}>
                  <span
                    aria-hidden="true"
                    className={s.mvIcon}
                    style={{ background: entry ? 'var(--sucesso-fundo)' : 'var(--cor-creme)', color: entry ? 'var(--sucesso)' : 'var(--texto-secundario)' }}
                  >
                    <Icon name={entry ? 'adicionar' : transfer ? 'avancar' : 'remover'} size={18} />
                  </span>
                  <div style={{ flex: '1 1 0', minWidth: 0 }}>
                    <div className={o.bold}>{t.title}</div>
                    <div className={o.small}>
                      {isTodayIso(t.at) ? `Hoje, ${hourMinute(t.at)}` : shortDate(t.at)} · {t.sub}
                    </div>
                  </div>
                  <b style={{ color: entry ? 'var(--sucesso)' : undefined, whiteSpace: 'nowrap' }}>
                    {transfer ? '' : entry ? '+ ' : '− '}
                    {formatCents(Math.abs(t.amountCents))}
                  </b>
                </div>
              )
            })}
          </Box>
        )}
        <div className={o.card}>
          <SumRow label="Entradas no período" value={`+ ${formatCents(ins)}`} />
          <SumRow label="Saídas no período" value={`− ${formatCents(Math.abs(outs))}`} />
        </div>
        {/* H-G20 — transferência entre as contas não é entrada nem saída */}
        <p className={o.muted}>Vendas, compras e baixas de contas entram sozinhas. Transferência entre caixa e banco não conta como entrada nem saída.</p>
      </main>
    </div>
  )
}
