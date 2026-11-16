import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { Tag } from '@/components/Badges'
import { Box } from '@/components/Card'
import { Button, ButtonLink } from '@/components/Button'
import { Banner, EmptyState } from '@/components/Feedback'
import { TextField } from '@/components/Field'
import { Icon } from '@/components/Icon'
import { QuantityStepper } from '@/components/QuantityStepper'
import { formatQty } from '@/domain/backoffice'
import { daysUntil, fullDate, hourMinute } from '@/domain/dates'
import { formatCents } from '@/domain/money'
import { itemsStore, productionStore, recipesStore } from '@/services/gestao/backoffice'
import { completeOrder, defaultExpiry, startOrder, undoCompletion, type Completion } from '@/services/gestao/production'
import o from '@/styles/ops.module.css'
import { Bar, StepBars, SumRow } from '../../../shared/OpsBits'
import s from '../estoque/Estoque.module.css'

const stepFor = (unit: string) => (unit === 'kg' ? 0.1 : unit === 'ml' ? 5 : 1)

export function Ordem() {
  const { id = '' } = useParams()
  const op = productionStore.useStore().find((p) => p.id === id)
  const items = itemsStore.useStore()
  const recipe = recipesStore.useStore().find((r) => r.id === op?.recipeId)
  const product = items.find((i) => i.id === op?.productId)

  const planned = recipe ? Object.fromEntries(recipe.lines.map((l) => [l.itemId, Math.round(l.qty * (op?.batches ?? 1) * 1000) / 1000])) : {}
  const [used, setUsed] = useState<Record<string, number>>({})
  const [good, setGood] = useState<number | null>(null)
  const [lot, setLot] = useState('')
  const [expiry, setExpiry] = useState('')
  const [done, setDone] = useState<{ completion: Completion; previousCost: number } | null>(null)

  if (!op || !recipe || !product) {
    return (
      <div className={o.screen}>
        <Bar title="Ordem" back="/gestao/producao" />
        <EmptyState bare icon="producao" title="Ordem não encontrada" action={<ButtonLink to="/gestao/producao">Ver ordens</ButtonLink>} />
      </div>
    )
  }

  const qtyUsed = (itemId: string) => used[itemId] ?? planned[itemId]
  const goodQty = good ?? Math.max(0, op.plannedQty - 1)
  const lotCode = lot || `${product.name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()}-${String(new Date().getMonth() + 1).padStart(2, '0')}${String(new Date().getDate()).padStart(2, '0')}`
  const expiryValue = expiry || defaultExpiry(recipe)
  const consumedCost = recipe.lines.reduce((n, l) => n + qtyUsed(l.itemId) * (items.find((i) => i.id === l.itemId)?.costCents ?? 0), 0)
  const realUnit = goodQty > 0 ? Math.round((consumedCost + recipe.indirectCostCents * op.batches) / goodQty) : null
  const prevUnit = Math.round(
    (recipe.lines.reduce((n, l) => n + l.qty * (items.find((i) => i.id === l.itemId)?.costCents ?? 0), 0) + recipe.indirectCostCents) / recipe.yieldQty,
  )
  const when = `${op.batches} ${op.batches === 1 ? recipe.batchLabel : `${recipe.batchLabel}s`} · previsto ${op.plannedQty} un · ${op.destination.kind === 'order' ? `para o pedido #${op.destination.orderNumber}` : 'para estoque'}`

  const finish = () => {
    const previousCost = product.costCents
    const completion = completeOrder(op.id, {
      consumptions: recipe.lines.map((l) => ({ itemId: l.itemId, qty: qtyUsed(l.itemId) })),
      goodQty,
      lotCode,
      expiry: expiryValue ? new Date(`${expiryValue}T12:00:00`).toISOString() : null,
    })
    setDone({ completion, previousCost })
  }

  // concluída agora ou aberta depois: o resumo vem da própria ordem
  if (op.status === 'done') {
    const cons = op.consumptions ?? []
    return (
      <div className={o.screen}>
        <Bar title={op.number} back="/gestao/producao" />
        <main className={`${o.main} ${o.narrow}`} style={{ paddingTop: 24 }}>
          <StepBars total={3} done={3} />
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 8 }}>
            <div aria-hidden="true" className={s.doneIcon}>
              <Icon name="confirmar" size={32} />
            </div>
            <h2 style={{ font: '700 24px/30px var(--fonte-titulo)' }}>Produção concluída</h2>
          </div>
          <section className={o.section}>
            <div className={o.iconLine} style={{ alignItems: 'center' }}>
              <Icon name="adicionar" size={20} />
              <b>Entrou no estoque</b>
            </div>
            <div className={o.card}>
              <div className={`${o.cardHead} ${o.num}`}>
                <span>
                  <b>{product.name}</b>
                  <span className={o.small} style={{ display: 'block' }}>
                    {op.lotCode ? `Lote ${op.lotCode}` : 'Sem lote'}
                  </span>
                </span>
                <b style={{ color: 'var(--sucesso)' }}>+ {op.goodQty} un</b>
              </div>
            </div>
          </section>
          {cons.length > 0 && (
            <section className={o.section}>
              <div className={o.iconLine} style={{ alignItems: 'center' }}>
                <Icon name="remover" size={20} />
                <b>Saiu do estoque (insumos)</b>
              </div>
              <div className={o.card}>
                {cons.map((c) => {
                  const it = items.find((i) => i.id === c.itemId)!
                  return <SumRow key={c.itemId} label={it.name} value={formatQty(c.qty, it.unit)} />
                })}
              </div>
            </section>
          )}
          <div className={o.card}>
            <SumRow label="Custo real / un" value={op.realUnitCostCents !== null ? formatCents(op.realUnitCostCents) : '—'} />
            <SumRow label="Perda na produção" value={`${op.plannedQty - (op.goodQty ?? 0)} un`} />
          </div>
        </main>
        <div className={o.footer}>
          <ButtonLink to={`/gestao/estoque/${product.id}`} size="l" block>
            Ver estoque de {product.name.split(' ')[0].toLowerCase()} {product.name.split(' ')[1]?.toLowerCase()}
          </ButtonLink>
          {done && (
            <Button
              variant="secondary"
              block
              onClick={() => {
                undoCompletion(done.completion, done.previousCost)
                setDone(null)
              }}
            >
              Corrigir apontamento
            </Button>
          )}
        </div>
      </div>
    )
  }

  if (op.status === 'planned') {
    return (
      <div className={o.screen}>
        <Bar title={op.number} back="/gestao/producao" />
        <main className={`${o.main} ${o.mainTop} ${o.narrow}`}>
          <StepBars total={3} done={0} current={0} />
          <div style={{ font: '700 24px/30px var(--fonte-titulo)' }}>{product.name}</div>
          <div className={`${o.muted} ${o.num}`}>
            {when} · começa {daysUntil(op.startAt) === 0 ? 'hoje' : fullDate(op.startAt)} às {hourMinute(op.startAt)}
          </div>
          <Banner tone="info">Ordem planejada. Os insumos estão reservados; inicie quando a produção começar.</Banner>
        </main>
        <div className={o.footer}>
          <Button size="l" block onClick={() => startOrder(op.id)}>
            Iniciar produção
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className={o.screen}>
      <Bar title={op.number} back="/gestao/producao" />
      <main className={`${o.main} ${o.mainTop} ${o.narrow}`}>
        <div className={o.section}>
          <StepBars total={3} done={1} current={1} />
          <div style={{ font: '700 24px/30px var(--fonte-titulo)' }}>{product.name}</div>
          <div className={`${o.muted} ${o.num}`}>
            {when} · iniciada {daysUntil(op.startAt) === 0 ? 'hoje' : fullDate(op.startAt)} {hourMinute(op.startAt)}, termina {hourMinute(op.endAt)}
          </div>
        </div>
        <section className={o.section}>
          <h2 className={o.h2}>Consumo real</h2>
          <p className={o.muted}>Ajuste se usou mais ou menos que a ficha.</p>
          <Box>
            {recipe.lines.map((l) => {
              const it = items.find((i) => i.id === l.itemId)!
              const diff = Math.round((qtyUsed(l.itemId) - planned[l.itemId]) * 1000) / 1000
              return (
                <div key={l.itemId} style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '12px 0', borderBottom: '1px solid var(--linha)' }}>
                  <div className={o.cardHead}>
                    <span className={o.bold}>{it.name}</span>
                    {diff === 0 ? <Tag tone="success">Como previsto</Tag> : <Tag tone="warning">{`${diff > 0 ? '+' : '−'}${formatQty(Math.abs(diff), it.unit)}`}</Tag>}
                  </div>
                  <div className={o.cardHead}>
                    <span className={`${o.muted} ${o.num}`}>Previsto {formatQty(planned[l.itemId], it.unit)}</span>
                    <QuantityStepper label={`Consumo real de ${it.name}`} value={qtyUsed(l.itemId)} step={stepFor(it.unit)} onChange={(v) => setUsed((u) => ({ ...u, [l.itemId]: v }))} />
                  </div>
                </div>
              )
            })}
          </Box>
        </section>
        <section className={o.section}>
          <h2 className={o.h2}>Rendimento</h2>
          <div className={o.card} style={{ gap: 10 }}>
            <div className={o.cardHead}>
              <span>
                <b id="boas">Unidades boas</b>
                <span className={`${o.small} ${o.num}`} style={{ display: 'block' }}>
                  previsto {op.plannedQty} · {Math.round((goodQty / op.plannedQty) * 100)}% do previsto
                </span>
              </span>
              <QuantityStepper labelledBy="boas" value={goodQty} onChange={(v) => setGood(Math.min(v, op.plannedQty + 4))} />
            </div>
            {product.tracksLots && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 10 }}>
                <TextField label="Lote" value={lotCode} onChange={(e) => setLot(e.target.value)} />
                <TextField label="Validade" type="date" value={expiryValue} onChange={(e) => setExpiry(e.target.value)} />
              </div>
            )}
          </div>
        </section>
        <div className={o.card}>
          <SumRow label="Custo previsto / un" value={formatCents(prevUnit)} />
          <div className={`${o.sumTotal} ${o.num}`}>
            <span>Custo real / un</span>
            <span>{realUnit !== null ? formatCents(realUnit) : '—'}</span>
          </div>
        </div>
      </main>
      <div className={o.footer}>
        <Button size="l" block onClick={finish}>
          Concluir produção
        </Button>
      </div>
    </div>
  )
}
