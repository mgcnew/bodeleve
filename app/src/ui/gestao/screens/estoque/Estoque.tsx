import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Tag } from '@/components/Badges'
import { Box } from '@/components/Card'
import { ButtonLink } from '@/components/Button'
import { EmptyState } from '@/components/Feedback'
import { FilterChips } from '@/components/Field'
import { Icon } from '@/components/Icon'
import { formatQty } from '@/domain/backoffice'
import { daysUntil, shortDate } from '@/domain/dates'
import { formatCents } from '@/domain/money'
import { balanceOf, expiringLots, lotsOf } from '@/services/gestao/stock'
import { useStockContext } from '@/services/gestao/useBackoffice'
import o from '@/styles/ops.module.css'
import { PageHeader } from '../../../shared/OpsBits'
import { ItemSeal } from '../../components/ItemSeal'
import s from './Estoque.module.css'

type Filter = 'all' | 'low' | 'expiring'

/** "R$ 8,4 mil" */
function compactCents(cents: number) {
  const reais = cents / 100
  return reais >= 1000 ? `R$ ${(reais / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} mil` : formatCents(cents)
}

export function useStockRows() {
  const ctx = useStockContext()
  return useMemo(
    () =>
      ctx.items.map((item) => {
        const balance = balanceOf(item.id, ctx)
        const lots = lotsOf(item.id, ctx.lots, ctx.movements)
        const expiring = expiringLots(lots)
        return { item, balance, lots, expiring, low: balance.available < item.minStock }
      }),
    [ctx],
  )
}

export function Estoque() {
  const rows = useStockRows()
  const [filter, setFilter] = useState<Filter>('all')
  const low = rows.filter((r) => r.low)
  const expiring = rows.filter((r) => r.expiring.length > 0)
  const value = rows.reduce((n, r) => n + Math.max(0, r.balance.physical) * r.item.costCents, 0)
  const visible = (filter === 'low' ? low : filter === 'expiring' ? expiring : rows)
    // primeiro o que pede atenção
    .slice()
    .sort((a, b) => Number(b.low || b.expiring.length > 0) - Number(a.low || a.expiring.length > 0))

  return (
    <div className={o.screen}>
      <PageHeader title="Estoque" sub="Saldo disponível = físico menos reservado" />
      <main className={o.main} style={{ gap: 16 }}>
        <div className={s.summary}>
          <button type="button" className={s.sum} style={{ background: 'var(--atencao-fundo)', color: 'var(--atencao)' }} onClick={() => setFilter('low')}>
            <span>Baixo</span>
            <b>{low.length}</b>
          </button>
          <button type="button" className={s.sum} style={{ background: 'var(--erro-fundo)', color: 'var(--erro)' }} onClick={() => setFilter('expiring')}>
            <span>Vencendo</span>
            <b>{expiring.length}</b>
          </button>
          <div className={s.sum} style={{ background: 'var(--superficie)', border: '1px solid var(--linha)' }}>
            <span>Valor</span>
            <b>{compactCents(value)}</b>
          </div>
        </div>
        <div className={s.actions}>
          <ButtonLink to="/gestao/estoque/inventario" variant="secondary" block>
            <Icon name="confirmar" size={20} />
            Contar estoque
          </ButtonLink>
          <ButtonLink to="/gestao/estoque/ajuste" variant="secondary" block>
            <Icon name="remover" size={20} />
            Registrar perda
          </ButtonLink>
        </div>
        <FilterChips
          label="Filtrar itens"
          value={filter}
          onChange={setFilter}
          options={[
            { value: 'all', label: `Todos · ${rows.length}` },
            { value: 'low', label: `Baixo · ${low.length}` },
            { value: 'expiring', label: `Vencendo · ${expiring.length}` },
          ]}
        />
        {visible.length === 0 ? (
          <EmptyState icon="estoque" title="Nada por aqui" text={filter === 'low' ? 'Nenhum item abaixo do mínimo.' : 'Nenhum lote vence nos próximos 7 dias.'} />
        ) : (
          <Box>
            {visible.map(({ item, balance, expiring: exp, low: isLow }) => {
              const extra = exp[0]?.expiry
                ? `Lote vence ${shortDate(exp[0].expiry)}${daysUntil(exp[0].expiry) < 0 ? ' · vencido' : ''}`
                : balance.incoming > 0
                  ? `${formatQty(balance.incoming, item.unit)} a receber`
                  : ''
              return (
                <Link key={item.id} to={`/gestao/estoque/${item.id}`} className={s.row}>
                  <span className={s.rowMain}>
                    <span className={o.bold}>{item.name}</span>
                    <span className={s.tags}>
                      <ItemSeal item={item} />
                      {isLow && <Tag tone="warning">Baixo</Tag>}
                      {exp.length > 0 && <Tag tone="error">Vencendo</Tag>}
                    </span>
                    {extra && <span className={o.small}>{extra}</span>}
                  </span>
                  <span className={s.qty}>
                    <b style={{ color: isLow ? 'var(--atencao)' : undefined }}>{formatQty(balance.available, item.unit)}</b>
                    <span>mín. {formatQty(item.minStock, item.unit)}</span>
                  </span>
                  <Icon name="avancar" size={18} />
                </Link>
              )
            })}
          </Box>
        )}
        <p className={o.muted}>Itens à venda e matérias-primas ficam juntos; o selo mostra o tipo de cada um.</p>
      </main>
    </div>
  )
}
