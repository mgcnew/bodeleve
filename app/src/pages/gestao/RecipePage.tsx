import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { Banner, Button, ButtonLink, EmptyState, Icon, IndicatorSkeleton, Indicator, QuantityStepper, StatusTag } from '@/components'
import type { Destination } from '@/domain/production'
import { formatBRL } from '@/lib/format'
import { useServices } from '@/services'
import type { InputCheckView, ProductionOrderView, RecipeView } from '@/services/types'
import { useAdminOrders, useInvalidateProduction, useRecipe } from '@/ui/gestao/queries'
import { Footer, QueryBoundary, RadioCard, ScreenHeader } from '@/ui/loja/parts'
import { useQuery } from '@tanstack/react-query'
import { KindBadge } from './KindBadge'
import s from '@/ui/gestao/gestao.module.css'
import l from '@/ui/loja/loja.module.css'

const selectStyle = { height: 48, padding: '0 12px', borderRadius: 8, border: '1.5px solid var(--linha)', background: 'var(--superficie)', font: 'var(--corpo)' } as const

const starts = [
  { id: 'tomorrow', label: 'Amanhã, 08h', plus: 1, hour: 8, now: false },
  { id: 'after', label: 'Depois de amanhã, 08h', plus: 2, hour: 8, now: false },
  { id: 'now', label: 'Hoje, agora', plus: 0, hour: new Date().getHours(), now: true },
] as const

function useCheck(recipeId: string, batches: number) {
  const { admin } = useServices()
  return useQuery({ queryKey: ['admin', 'recipe-check', recipeId, batches], queryFn: () => admin.production.check(recipeId, batches) })
}

function adviceFor(c: InputCheckView): string {
  if (!c.missingAny) return 'Os insumos ficam reservados para esta ordem.'
  const short = c.lines.filter((x) => x.missing > 0)
  if (c.coveredByIncoming) {
    return `${short.length === 1 ? `O ${short[0].name.toLowerCase()} que falta chega hoje na compra em andamento (${short[0].incomingToday} un).` : 'O que falta chega hoje nas compras em andamento.'} A ordem pode ser criada.`
  }
  return 'Faltam insumos: a ordem fica planejada até a compra chegar.'
}

function Producer({ recipe }: { recipe: RecipeView }) {
  const { admin } = useServices()
  const invalidate = useInvalidateProduction()
  const orders = useAdminOrders()
  const [batches, setBatches] = useState(2)
  const [dest, setDest] = useState<'stock' | 'order'>('stock')
  const [orderId, setOrderId] = useState('')
  const [when, setWhen] = useState<(typeof starts)[number]['id']>('tomorrow')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState<{ order: ProductionOrderView; reservedText: string } | null>(null)
  const check = useCheck(recipe.id, batches)
  const open = (orders.data ?? []).filter((o) => o.channel === 'online')

  const create = async () => {
    setError(null)
    if (dest === 'order' && !orderId) return setError('Escolha o pedido que esta ordem vai atender.')
    const w = starts.find((x) => x.id === when)!
    const d = new Date()
    const startsAt = new Date(d.getFullYear(), d.getMonth(), d.getDate() + w.plus, w.hour).toISOString()
    const destination: Destination = dest === 'stock' ? { kind: 'stock' } : { kind: 'order', orderId }
    setBusy(true)
    try {
      const r = await admin.production.createOrder({ recipeId: recipe.id, batches, destination, startsAt, startNow: w.now })
      await invalidate()
      setDone(r)
    } catch {
      setError('Não foi possível criar a ordem. Nada foi reservado. Tente de novo.')
    }
    setBusy(false)
  }
  const undo = async () => {
    if (!done) return
    setBusy(true)
    try {
      await admin.production.undoCreate(done.order.id)
      await invalidate()
      setDone(null)
    } catch {
      setError('Não foi possível desfazer: a ordem já começou.')
    }
    setBusy(false)
  }

  if (done) {
    const when2 = starts.find((x) => x.id === when)!
    return (
      <>
        <div className={l.stack} style={{ alignItems: 'center', gap: 12, paddingTop: 24, textAlign: 'center' }}>
          <div className={l.disc} style={{ width: 64, height: 64, background: 'var(--sucesso-fundo)', color: 'var(--sucesso)' }} aria-hidden="true"><Icon name="confirmar" size={32} /></div>
          <h1 className={l.h1}>Ordem {done.order.id} criada</h1>
          <div className={l.sub}>
            {done.order.plannedQty} un de {recipe.name} · {when2.now ? 'começou agora' : `começa ${when2.label.toLowerCase().replace(', ', ' às ')}`}
            {done.reservedText ? ` · ${done.reservedText} reservados` : ''}
          </div>
          {error && <Banner tone="error">{error}</Banner>}
        </div>
        <Footer>
          <ButtonLink href="/gestao/producao" size="lg" fullWidth>Ver ordens de produção</ButtonLink>
          <Button variant="ghost" fullWidth loading={busy} onClick={undo}>Desfazer</Button>
        </Footer>
      </>
    )
  }

  return (
    <>
      <section className={`${l.card} ${l.cardLg}`} style={{ display: 'flex', flexDirection: 'column', gap: 12 }} aria-labelledby="prod-t">
        <h2 id="prod-t" className={l.h2}>Produzir</h2>
        <div className={l.spread}>
          <span>
            <b>{recipe.batchLabel === 'fornada' ? 'Fornadas' : recipe.batchLabel === 'tacho' ? 'Tachos' : 'Lotes'}</b>
            <span className={`${l.small} ${l.tabular}`} style={{ display: 'block' }}>{recipe.yieldPerBatch * batches} un · custo {formatBRL(recipe.batchCostCents * batches)}</span>
          </span>
          <QuantityStepper label={`Número de ${recipe.batchLabel === 'fornada' ? 'fornadas' : recipe.batchLabel === 'tacho' ? 'tachos' : 'lotes'}`} variant="compact" value={batches} min={1} max={6} onChange={setBatches} />
        </div>

        <QueryBoundary query={check} skeleton={<IndicatorSkeleton label="Conferindo insumos" />} errorTitle="Não foi possível conferir os insumos">
          {(c) => (
            <>
              <div className={l.linkList}>
                {c.lines.map((x) => (
                  <div key={x.itemId} className={l.spread} style={{ padding: '10px 0', borderTop: '1px solid var(--linha)' }}>
                    <span className={l.strong}>
                      {x.name}
                      <span className={`${l.small} ${l.tabular}`} style={{ display: 'block', fontWeight: 400 }}>precisa {x.needText} · tem {x.haveText}</span>
                    </span>
                    {x.missing > 0 ? <StatusTag tone="warning">Faltam {x.missingText}</StatusTag> : <StatusTag tone="success">Tem</StatusTag>}
                  </div>
                ))}
              </div>
              <div role="status" aria-live="polite" className={l.sub}>{adviceFor(c)}</div>
            </>
          )}
        </QueryBoundary>

        <fieldset className={l.fieldset}>
          <legend className={l.legend}>Para onde vai</legend>
          <RadioCard name="destino" value="stock" checked={dest === 'stock'} onChange={() => setDest('stock')} title="Para estoque" detail="Produção antecipada" />
          <RadioCard name="destino" value="order" checked={dest === 'order'} onChange={() => setDest('order')} title="Para um pedido" detail="Sob demanda: escolha o pedido" />
        </fieldset>
        {dest === 'order' && (
          <div className={l.stack} style={{ gap: 6 }}>
            <label htmlFor="pedido" className={l.strong} style={{ fontSize: 14 }}>Pedido</label>
            <select id="pedido" value={orderId} onChange={(e) => setOrderId(e.target.value)} style={selectStyle}>
              <option value="">Escolha o pedido</option>
              {open.map((o) => <option key={o.id} value={o.id}>#{o.id} · {o.contact.name}</option>)}
            </select>
          </div>
        )}
        <div className={l.stack} style={{ gap: 6 }}>
          <label htmlFor="quando" className={l.strong} style={{ fontSize: 14 }}>Começar em</label>
          <select id="quando" value={when} onChange={(e) => setWhen(e.target.value as typeof when)} style={selectStyle}>
            {starts.map((w) => <option key={w.id} value={w.id}>{w.label}</option>)}
          </select>
        </div>
        {error && <Banner tone="error">{error}</Banner>}
      </section>
      <div style={{ padding: '0 16px 8px' }}><ButtonLink href={`/gestao/producao/fichas/${recipe.id}/editar`} variant="secondary" fullWidth>Editar ficha técnica</ButtonLink></div>
      <Footer>
        <Button size="lg" fullWidth loading={busy} onClick={create}>{busy ? 'Criando…' : 'Criar ordem de produção'}</Button>
      </Footer>
    </>
  )
}

export function RecipePage() {
  const { id } = useParams()
  const query = useRecipe(id)
  return (
    <QueryBoundary query={query} skeleton={<><ScreenHeader title="Ficha técnica" back="/gestao/producao/fichas" /><main className={s.main}><IndicatorSkeleton label="Carregando ficha" /></main></>} errorTitle="Não foi possível carregar a ficha">
      {(r) =>
        !r ? (
          <>
            <ScreenHeader title="Ficha técnica" back="/gestao/producao/fichas" />
            <main className={s.main}><EmptyState icon="producao" title="Ficha não encontrada" action={<ButtonLink href="/gestao/producao/fichas">Ver fichas</ButtonLink>} /></main>
          </>
        ) : (
          <>
            <ScreenHeader title="Ficha técnica" back="/gestao/producao/fichas" />
            <main className={s.main} style={{ gap: 16, paddingTop: 16 }}>
              <div className={l.stack} style={{ gap: 6 }}>
                <div><KindBadge itemType={r.itemType} origin={r.origin} /></div>
                <h1 className={l.h1} style={{ fontSize: 22 }}>{r.name}</h1>
                <div className={l.sub}>Rende {r.yieldPerBatch} un por {r.batchLabel} · validade {r.shelfLifeDays} dias</div>
              </div>
              <div className={s.todayGrid} style={{ gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' }}>
                <Indicator label="Custo / un" value={formatBRL(r.unitCostCents)} />
                <Indicator label="Preço" value={r.priceCents != null ? formatBRL(r.priceCents) : '—'} />
                <Indicator label="Margem" value={r.marginPercent != null ? `${r.marginPercent}%` : '—'} />
              </div>
              <section className={l.section} aria-labelledby="forn-t">
                <h2 id="forn-t" className={l.h2}>Por {r.batchLabel}</h2>
                <div className={l.linkList}>
                  {r.lines.map((x) => (
                    <div key={x.itemId} className={l.spread} style={{ padding: '10px 0', borderTop: '1px solid var(--linha)' }}>
                      <span>{x.name}<span className={l.small} style={{ display: 'block' }}>{x.qtyText}</span></span>
                      <span className={l.tabular}>{formatBRL(x.costCents)}</span>
                    </div>
                  ))}
                  <div className={l.spread} style={{ padding: '10px 0', borderTop: '1px solid var(--linha)' }}>
                    <span>Gás e energia (estimado)<span className={l.small} style={{ display: 'block' }}>—</span></span>
                    <span className={l.tabular}>{formatBRL(r.overheadCents)}</span>
                  </div>
                  <div className={`${l.spread} ${l.strong} ${l.tabular}`} style={{ padding: '10px 0', borderTop: '1px solid var(--linha)' }}>
                    <span>Total da {r.batchLabel}</span><span>{formatBRL(r.batchCostCents)}</span>
                  </div>
                </div>
                <div className={l.sub}>Modo de preparo: {r.method}</div>
              </section>
              <Producer key={r.id} recipe={r} />
            </main>
          </>
        )
      }
    </QueryBoundary>
  )
}
