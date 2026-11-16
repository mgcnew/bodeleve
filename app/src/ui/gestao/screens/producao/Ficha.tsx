import { useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Tag } from '@/components/Badges'
import { Box } from '@/components/Card'
import { Button, ButtonLink } from '@/components/Button'
import { Banner, EmptyState } from '@/components/Feedback'
import { RadioGroup, SelectField, TextField } from '@/components/Field'
import { Icon } from '@/components/Icon'
import { QuantityStepper } from '@/components/QuantityStepper'
import { formatQty } from '@/domain/backoffice'
import { daysFromToday, hourMinute } from '@/domain/dates'
import { formatCents } from '@/domain/money'
import { itemsStore, recipesStore } from '@/services/gestao/backoffice'
import { staffOrdersStore } from '@/services/gestao/orders'
import { batchCostCents, createOrder, margin, needsFor, removeOrder, unitCostCents } from '@/services/gestao/production'
import { useStockContext } from '@/services/gestao/useBackoffice'
import o from '@/styles/ops.module.css'
import { Bar, SumRow, SumTotal } from '../../../shared/OpsBits'
import { ItemSeal } from '../../components/ItemSeal'
import s from '../estoque/Estoque.module.css'

export function Ficha() {
  const { id = '' } = useParams()
  const recipe = recipesStore.useStore().find((r) => r.id === id)
  const items = itemsStore.useStore()
  const ctx = useStockContext()
  const orders = staffOrdersStore.useStore()

  const [batches, setBatches] = useState(2)
  const [dest, setDest] = useState<'stock' | 'order'>('stock')
  const [orderNumber, setOrderNumber] = useState('')
  const [start, setStart] = useState(`${daysFromToday(1).slice(0, 10)}T08:00`)
  const [created, setCreated] = useState<{ id: string; number: string; summary: string } | null>(null)

  const needs = useMemo(() => (recipe ? needsFor(recipe, batches, items, ctx) : []), [recipe, batches, items, ctx])

  if (!recipe) {
    return (
      <div className={o.screen}>
        <Bar title="Ficha técnica" back="/gestao/producao/fichas" />
        <EmptyState bare icon="producao" title="Ficha não encontrada" action={<ButtonLink to="/gestao/producao/fichas">Ver fichas</ButtonLink>} />
      </div>
    )
  }

  const product = items.find((i) => i.id === recipe.productId)!
  const cost = unitCostCents(recipe, items)
  const m = margin(cost, product.priceCents)
  const missing = needs.filter((n) => n.missing > 0)
  const covered = missing.length > 0 && missing.every((n) => n.incoming >= n.missing)
  const eligible = orders.filter((x) => x.status === 'new' || x.status === 'separating')

  if (created) {
    return (
      <div className={o.screen}>
        <Bar title="Ficha técnica" back="/gestao/producao/fichas" />
        <main className={s.done}>
          <div aria-hidden="true" className={s.doneIcon}>
            <Icon name="confirmar" size={32} />
          </div>
          <h2 style={{ font: '700 24px/30px var(--fonte-titulo)' }}>Ordem {created.number} criada</h2>
          <p className={`${o.secondary} ${o.num}`}>{created.summary}</p>
        </main>
        <div className={o.footer}>
          <ButtonLink to="/gestao/producao" size="l" block>
            Ver ordens de produção
          </ButtonLink>
          <Button
            variant="secondary"
            block
            onClick={() => {
              removeOrder(created.id)
              setCreated(null)
            }}
          >
            Desfazer
          </Button>
        </div>
      </div>
    )
  }

  const create = () => {
    const startAt = new Date(start).toISOString()
    const op = createOrder({
      recipe,
      batches,
      destination: dest === 'order' && orderNumber ? { kind: 'order', orderNumber } : { kind: 'stock' },
      startAt,
    })
    setCreated({
      id: op.id,
      number: op.number,
      summary: `${op.plannedQty} un de ${product.name} · começa ${new Date(startAt).toLocaleDateString('pt-BR', { weekday: 'long' })} às ${hourMinute(startAt)} · insumos reservados para esta ordem`,
    })
  }

  return (
    <div className={o.screen}>
      <Bar title="Ficha técnica" back="/gestao/producao/fichas" />
      <main className={`${o.main} ${o.mainTop} ${o.narrow}`}>
        <div className={o.section} style={{ gap: 6 }}>
          <div>
            <ItemSeal item={product} />
          </div>
          <div style={{ font: '700 26px/32px var(--fonte-titulo)' }}>{product.name}</div>
          <div className={o.muted}>
            Rende {recipe.yieldQty} un por {recipe.batchLabel} · validade {recipe.shelfLifeDays} dias
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 8 }}>
          {[
            ['Custo / un', formatCents(cost)],
            ['Preço', product.priceCents ? formatCents(product.priceCents) : '—'],
            ['Margem', m !== null ? `${Math.round(m * 100)}%` : '—'],
          ].map(([t, v]) => (
            <div key={t} className={s.bal} style={{ padding: 12 }}>
              <span style={{ fontSize: 12, lineHeight: '16px' }}>{t}</span>
              <b style={{ fontSize: 18, lineHeight: '24px' }}>{v}</b>
            </div>
          ))}
        </div>
        <section className={o.section}>
          <h2 className={o.h2}>Por {recipe.batchLabel}</h2>
          <Box>
            {recipe.lines.map((l) => {
              const it = items.find((i) => i.id === l.itemId)!
              return (
                <div key={l.itemId} className={`${o.cardHead} ${o.num}`} style={{ padding: '10px 0', borderBottom: '1px solid var(--linha)', alignItems: 'flex-start' }}>
                  <span>
                    {it.name}
                    <span className={o.small} style={{ display: 'block' }}>
                      {formatQty(l.qty, it.unit)}
                    </span>
                  </span>
                  <span>{formatCents(Math.round(l.qty * it.costCents))}</span>
                </div>
              )
            })}
            {/* H-G19 — gás e energia entram como custo indireto estimado por fornada */}
            <div className={`${o.cardHead} ${o.num}`} style={{ padding: '10px 0', borderBottom: '1px solid var(--linha)', alignItems: 'flex-start' }}>
              <span>
                Gás e energia (estimado)
                <span className={o.small} style={{ display: 'block' }}>
                  —
                </span>
              </span>
              <span>{formatCents(recipe.indirectCostCents)}</span>
            </div>
            <div className={`${o.cardHead} ${o.num}`} style={{ padding: '10px 0', fontWeight: 600 }}>
              <span>Total da {recipe.batchLabel}</span>
              <span>{formatCents(batchCostCents(recipe, items))}</span>
            </div>
          </Box>
          <p className={o.muted}>Modo de preparo: {recipe.prepNotes}</p>
        </section>

        <section className={o.section} style={{ padding: 16, borderRadius: 16, background: 'var(--cor-terracota-suave)', gap: 12 }}>
          <h2 className={o.h2}>Produzir</h2>
          <div className={o.cardHead}>
            <span>
              <b id="fornadas">{recipe.batchLabel.charAt(0).toUpperCase() + recipe.batchLabel.slice(1)}s</b>
              <span className={`${o.small} ${o.num}`} style={{ display: 'block' }}>
                {recipe.yieldQty * batches} un · custo {formatCents(batchCostCents(recipe, items) * batches)}
              </span>
            </span>
            <QuantityStepper labelledBy="fornadas" value={batches} min={1} onChange={(v) => setBatches(Math.min(6, v))} />
          </div>
          <Box>
            {needs.map((n) => (
              <div key={n.itemId} className={o.cardHead} style={{ padding: '10px 0', borderBottom: '1px solid var(--linha)', fontVariantNumeric: 'tabular-nums' }}>
                <span style={{ minWidth: 0 }}>
                  {n.name}
                  <span className={o.small} style={{ display: 'block' }}>
                    precisa {formatQty(n.need, n.unit)} · tem {formatQty(Math.max(0, n.have), n.unit)}
                  </span>
                </span>
                {n.missing > 0 ? <Tag tone="warning">Faltam {formatQty(n.missing, n.unit)}</Tag> : <Tag tone="success">Tem</Tag>}
              </div>
            ))}
          </Box>
          <RadioGroup
            legend="Para onde vai"
            name="destino"
            value={dest}
            onChange={setDest}
            options={[
              { value: 'stock', title: 'Para estoque', sub: 'Produção antecipada' },
              { value: 'order', title: 'Para um pedido', sub: 'Sob demanda: escolha o pedido' },
            ]}
          />
          {dest === 'order' && (
            <SelectField
              label="Pedido"
              value={orderNumber}
              onChange={(e) => setOrderNumber(e.target.value)}
              options={[{ value: '', label: 'Escolha o pedido' }, ...eligible.map((x) => ({ value: x.number, label: `#${x.number} · ${x.customer.name}` })), { value: '1045', label: '#1045 · pedido a chegar' }]}
            />
          )}
          <TextField label="Começar em" type="datetime-local" value={start} onChange={(e) => setStart(e.target.value)} />
        </section>
        <div aria-live="polite">
          {missing.length === 0 ? (
            <Banner tone="success">Os insumos ficam reservados para esta ordem.</Banner>
          ) : covered ? (
            <Banner tone="warning">{`${missing.map((n) => n.name.toLowerCase()).join(' e ')} que falta chega em compra já enviada. A ordem pode ser criada.`}</Banner>
          ) : (
            <Banner tone="warning">Faltam insumos: a ordem fica planejada até a compra chegar.</Banner>
          )}
        </div>
        <div className={o.card}>
          <SumRow label="Unidades previstas" value={`${recipe.yieldQty * batches} un`} />
          <SumTotal label="Custo previsto" value={formatCents(batchCostCents(recipe, items) * batches)} />
        </div>
      </main>
      <div className={o.footer}>
        <Button size="l" block onClick={create} disabled={dest === 'order' && !orderNumber}>
          Criar ordem de produção
        </Button>
      </div>
    </div>
  )
}
