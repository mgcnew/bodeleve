import { Pagination, usePagination } from '@/components/Pagination'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Tag, type Tone } from '@/components/Badges'
import { Box } from '@/components/Card'
import { EmptyState } from '@/components/Feedback'
import { FilterChips } from '@/components/Field'
import { Icon } from '@/components/Icon'
import { hourMinute, isTodayIso } from '@/domain/dates'
import { formatCents } from '@/domain/money'
import { payGroup, payLabels, type Sale } from '@/domain/pdv'
import { salesStore } from '@/services/pdv'
import { PageHeader } from '../../shared/OpsBits'
import o from '@/styles/ops.module.css'

type Filter = 'all' | 'cash' | 'pix' | 'card' | 'term'

export const payTone = (s: Sale): { label: string; tone: Tone } => {
  const m = s.payments[0].method
  const label = s.payments.length > 1 ? 'Combinado' : payLabels[m]
  return { label, tone: m === 'cash' ? 'success' : m === 'pix' || m === 'on_account' ? 'info' : 'warning' }
}

export function Vendas() {
  const all = salesStore.useStore().filter((s) => isTodayIso(s.at)).sort((a, b) => b.at.localeCompare(a.at))
  const [filter, setFilter] = useState<Filter>('all')
  const done = all.filter((s) => s.status === 'done')
  const total = done.reduce((n, s) => n + s.totalCents, 0)
  const visible = all.filter((s) => filter === 'all' || s.payments.some((p) => payGroup(p.method) === filter))

  const pg = usePagination(visible, filter)
  return (
    <div className={o.screen}>
      <PageHeader title="Vendas" sub={`Vendas de hoje · ${done.length} ${done.length === 1 ? 'venda' : 'vendas'} · ${formatCents(total)} no balcão`} />
      <main className={`${o.main} ${o.narrow}`} style={{ gap: 16 }}>
        <FilterChips
          label="Filtrar por forma"
          value={filter}
          onChange={setFilter}
          options={[
            { value: 'all', label: 'Todas' },
            { value: 'cash', label: 'Dinheiro' },
            { value: 'pix', label: 'Pix' },
            { value: 'card', label: 'Cartão' },
            { value: 'term', label: 'A prazo' },
          ]}
        />
        {visible.length === 0 ? (
          <EmptyState icon="historico" title="Nenhuma venda aqui" text="As vendas feitas no balcão aparecem nesta lista." />
        ) : (
          <Box>
            {pg.items.map((s) => {
              const t = payTone(s)
              const items = s.lines.length
              return (
                <Link key={s.id} to={`/pdv/vendas/${s.id}`} className={o.row}>
                  <span className={o.rowText}>
                    <span className={o.rowTitle}>{s.number}</span>
                    <span className={`${o.small} ${o.num}`}>
                      {hourMinute(s.at)} · {items} {items === 1 ? 'item' : 'itens'}
                      {s.customerName ? ` · ${s.customerName}` : ''}
                    </span>
                  </span>
                  <span className={o.rowEnd}>
                    <b style={{ textDecoration: s.status === 'cancelled' ? 'line-through' : undefined }}>{formatCents(s.totalCents)}</b>
                    {s.status === 'cancelled' ? <Tag tone="error">Cancelada</Tag> : s.pending ? <Tag tone={s.pending === 'failed' ? 'error' : 'warning'}>{s.pending === 'failed' ? 'Não enviada' : 'A enviar'}</Tag> : <Tag tone={t.tone}>{t.label}</Tag>}
                  </span>
                  <Icon name="avancar" size={18} />
                </Link>
              )
            })}
          </Box>
        )}
        <Pagination {...pg} />
      </main>
    </div>
  )
}
