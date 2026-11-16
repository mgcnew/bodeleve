import { useMemo, useState } from 'react'
import { Tag } from '@/components/Badges'
import { Box } from '@/components/Card'
import { Button, ButtonLink } from '@/components/Button'
import { SelectField } from '@/components/Field'
import { Icon } from '@/components/Icon'
import { QuantityStepper } from '@/components/QuantityStepper'
import { formatQty } from '@/domain/backoffice'
import { formatCents } from '@/domain/money'
import { categories, internalCategories } from '@/mocks/catalog'
import { applyInventory, physicalOf, removeMovements } from '@/services/gestao/stock'
import { useStockContext } from '@/services/gestao/useBackoffice'
import o from '@/styles/ops.module.css'
import { Bar, SumRow, SumTotal } from '../../../shared/OpsBits'
import s from './Estoque.module.css'

const sign = (n: number) => (n > 0 ? '+' : n < 0 ? '−' : '')

// H-G13 — inventário por área, com diferença em unidades e em custo antes de aplicar
export function Inventario() {
  const ctx = useStockContext()
  const areas = [...categories, ...internalCategories]
  const [area, setArea] = useState(areas[0].id)
  const items = useMemo(() => ctx.items.filter((i) => area === 'all' || i.categoryId === area), [ctx.items, area])
  const system = useMemo(() => Object.fromEntries(ctx.items.map((i) => [i.id, physicalOf(i.id, ctx.movements)])), [ctx.items, ctx.movements])
  const [counted, setCounted] = useState<Record<string, number>>({})
  const [applied, setApplied] = useState<{ ids: string[]; summary: string } | null>(null)

  const value = (id: string) => counted[id] ?? Math.max(0, Math.round(system[id]))
  const diffs = items.map((i) => ({ item: i, diff: Math.round((value(i.id) - system[i.id]) * 1000) / 1000 }))
  const withDiff = diffs.filter((d) => d.diff !== 0)
  const units = withDiff.reduce((n, d) => n + d.diff, 0)
  const cost = withDiff.reduce((n, d) => n + d.diff * d.item.costCents, 0)

  const apply = () => {
    const ids = applyInventory(items.map((i) => ({ itemId: i.id, counted: value(i.id) })))
    setApplied({
      ids,
      summary: ids.length === 0 ? 'Tudo conferiu. Nenhum ajuste foi feito.' : `${ids.length} ${ids.length === 1 ? 'ajuste lançado' : 'ajustes lançados'} · ${sign(cost)} ${formatCents(Math.abs(cost))} em custo`,
    })
  }

  if (applied) {
    return (
      <div className={o.screen}>
        <Bar title="Contar estoque" back="/gestao/estoque" />
        <main className={s.done}>
          <div aria-hidden="true" className={s.doneIcon}>
            <Icon name="confirmar" size={32} />
          </div>
          <h2 style={{ font: '700 24px/30px var(--fonte-titulo)' }}>Contagem aplicada</h2>
          <p className={`${o.secondary} ${o.num}`}>{applied.summary}</p>
        </main>
        <div className={o.footer}>
          <ButtonLink to="/gestao/estoque" size="l" block>
            Voltar ao estoque
          </ButtonLink>
          <Button
            variant="secondary"
            block
            onClick={() => {
              removeMovements(applied.ids)
              setApplied(null)
            }}
          >
            Corrigir contagem
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className={o.screen}>
      <Bar title="Contar estoque" back="/gestao/estoque" />
      <main className={`${o.main} ${o.mainTop} ${o.narrow}`}>
        <SelectField
          label="O que contar"
          value={area}
          onChange={(e) => {
            setArea(e.target.value)
            setCounted({})
          }}
          options={[
            ...areas.map((a) => ({ value: a.id, label: `${a.name} · ${ctx.items.filter((i) => i.categoryId === a.id).length} itens` })),
            { value: 'all', label: `Tudo · ${ctx.items.length} itens` },
          ]}
        />
        <p className={o.muted}>Conte o que está na prateleira e ajuste o número de cada item. Itens reservados para pedidos também contam.</p>
        <Box>
          {diffs.map(({ item, diff }) => (
            <div key={item.id} style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '12px 0', borderBottom: '1px solid var(--linha)' }}>
              <div className={o.cardHead}>
                <span className={o.bold}>{item.name}</span>
                {diff === 0 ? <Tag tone="success">Confere</Tag> : <Tag tone="warning">{diff > 0 ? `Sobra ${formatQty(diff, item.unit)}` : `Falta ${formatQty(-diff, item.unit)}`}</Tag>}
              </div>
              <div className={o.cardHead}>
                <span className={`${o.muted} ${o.num}`}>Sistema: {formatQty(system[item.id], item.unit)}</span>
                <QuantityStepper label={`Contado de ${item.name}`} value={value(item.id)} onChange={(v) => setCounted((c) => ({ ...c, [item.id]: v }))} />
              </div>
            </div>
          ))}
        </Box>
        <div className={o.card}>
          <SumRow label="Itens com diferença" value={withDiff.length} />
          <SumRow label="Diferença em unidades" value={`${sign(units)}${Math.abs(Math.round(units * 1000) / 1000)}`} />
          <SumTotal label="Diferença em custo" value={`${sign(cost)} ${formatCents(Math.abs(cost))}`} />
        </div>
      </main>
      <div className={o.footer}>
        <Button size="l" block onClick={apply}>
          Aplicar contagem
        </Button>
      </div>
    </div>
  )
}
