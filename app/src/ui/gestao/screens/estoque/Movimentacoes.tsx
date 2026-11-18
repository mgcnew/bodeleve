import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { Box } from '@/components/Card'
import { EmptyState } from '@/components/Feedback'
import { FilterChips } from '@/components/Field'
import { Icon } from '@/components/Icon'
import { formatQty } from '@/domain/backoffice'
import { hourMinute, isTodayIso, shortDate } from '@/domain/dates'
import { itemsStore, stockStore } from '@/services/gestao/backoffice'
import o from '@/styles/ops.module.css'
import { Bar } from '../../../shared/OpsBits'
import s from './Estoque.module.css'

type Filter = 'all' | 'in' | 'out'

export function Movimentacoes() {
  const { id = '' } = useParams()
  const item = itemsStore.useStore().find((i) => i.id === id)
  const { lots, movements } = stockStore.useStore()
  const [filter, setFilter] = useState<Filter>('all')

  const mine = movements.filter((m) => m.itemId === id).sort((a, b) => a.at.localeCompare(b.at))
  // saldo depois de cada movimento
  let running = 0
  const withBalance = mine.map((m) => ({ ...m, balance: (running = Math.round((running + m.qty) * 1000) / 1000) }))
  const visible = withBalance.filter((m) => filter === 'all' || (filter === 'in' ? m.qty > 0 : m.qty < 0)).reverse()

  if (!item) return <EmptyState bare icon="estoque" title="Item não encontrado" />

  return (
    <div className={o.screen}>
      <Bar title="Movimentações" back={`/gestao/estoque/${id}`} />
      <main className={`${o.main} ${o.mainTop} ${o.narrow}`}>
        <div>
          <div className={o.bold}>{item.name}</div>
          <div className={o.muted}>Saldo físico atual: {formatQty(running, item.unit)}</div>
        </div>
        <FilterChips
          label="Filtrar movimentações"
          value={filter}
          onChange={setFilter}
          options={[
            { value: 'all', label: 'Todas' },
            { value: 'in', label: 'Entradas' },
            { value: 'out', label: 'Saídas' },
          ]}
        />
        {visible.length === 0 ? (
          <EmptyState icon="historico" title="Nenhuma movimentação" text="Entradas e saídas deste item aparecem aqui." />
        ) : (
          <Box>
            {visible.map((m) => {
              const entry = m.qty > 0
              const lot = lots.find((l) => l.id === m.lotId)
              return (
                <div key={m.id} className={s.mv}>
                  <span
                    aria-hidden="true"
                    className={s.mvIcon}
                    style={{ background: entry ? 'var(--sucesso-fundo)' : 'var(--fundo-suave)', color: entry ? 'var(--sucesso)' : 'var(--texto-secundario)' }}
                  >
                    <Icon name={entry ? 'adicionar' : 'remover'} size={18} />
                  </span>
                  <div style={{ flex: '1 1 0', minWidth: 0 }}>
                    <div className={o.bold}>{m.note}</div>
                    <div className={o.small}>
                      {isTodayIso(m.at) ? 'Hoje' : shortDate(m.at)}, {hourMinute(m.at)}
                      {lot && ` · Lote ${lot.code}`} · por {m.by}
                    </div>
                  </div>
                  <div className={s.mvQty}>
                    <b style={{ color: entry ? 'var(--sucesso)' : undefined }}>
                      {entry ? '+' : '−'}
                      {formatQty(Math.abs(m.qty), item.unit)}
                    </b>
                    <span>saldo {formatQty(m.balance, item.unit)}</span>
                  </div>
                </div>
              )
            })}
          </Box>
        )}
        <p className={o.muted}>Reservas de pedidos online não são movimentação: só baixam o estoque quando o pedido sai.</p>
      </main>
    </div>
  )
}
