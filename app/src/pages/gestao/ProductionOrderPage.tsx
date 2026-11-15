import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { Banner, Button, ButtonLink, EmptyState, Icon, IndicatorSkeleton, QuantityStepper, StatusTag, TextField } from '@/components'
import { formatBrDate, parseBrDate } from '@/domain/purchasing'
import { formatBRL } from '@/lib/format'
import { useServices } from '@/services'
import type { FinishDefaults, FinishResult, ProductionOrderView } from '@/services/types'
import { useFinishDefaults, useInvalidateProduction, useProductionOrder } from '@/ui/gestao/queries'
import { Footer, QueryBoundary, ScreenHeader } from '@/ui/loja/parts'
import { destinationText, orderLine } from './production'
import s from '@/ui/gestao/gestao.module.css'
import l from '@/ui/loja/loja.module.css'

const num = (v: number, d: number) => v.toLocaleString('pt-BR', { minimumFractionDigits: d, maximumFractionDigits: d })

function Progress({ step }: { step: 0 | 1 | 2 }) {
  return (
    <div className={s.progress} aria-hidden="true">
      {[0, 1, 2].map((n) => <span key={n} className={`${s.progressBar} ${n < step ? s.progressDone : n === step ? s.progressNow : ''}`} />)}
    </div>
  )
}

function Pointing({ order, defaults, onDone }: { order: ProductionOrderView; defaults: FinishDefaults; onDone: (r: FinishResult) => void }) {
  const { admin } = useServices()
  const invalidate = useInvalidateProduction()
  const [qty, setQty] = useState<Record<string, number>>(() => Object.fromEntries(defaults.consumption.map((c) => [c.itemId, c.planned])))
  const [good, setGood] = useState(Math.max(0, defaults.plannedQty - 1))
  const [lot, setLot] = useState(defaults.suggestedLot)
  const [expiry, setExpiry] = useState(formatBrDate(defaults.suggestedExpiresAt))
  const [errors, setErrors] = useState<{ lot?: string; expiry?: string }>({})
  const [banner, setBanner] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const realCost = defaults.consumption.reduce((a, c) => a + (qty[c.itemId] / c.perUnit) * c.unitCostCents, 0) + defaults.overheadCents
  const unitCost = good > 0 ? Math.round(realCost / good) : null

  const finish = async () => {
    setBanner(null)
    const e: typeof errors = {}
    if (!lot.trim()) e.lot = 'Informe o lote do que foi produzido.'
    const exp = expiry.trim() ? parseBrDate(expiry) : null
    if (expiry.trim() && !exp) e.expiry = 'Data inválida. Use dia/mês/ano.'
    setErrors(e)
    if (Object.keys(e).length) return
    setBusy(true)
    try {
      const r = await admin.production.finish(order.id, {
        consumption: defaults.consumption.map((c) => ({ itemId: c.itemId, qty: qty[c.itemId] / c.perUnit })),
        goodQty: good,
        lotCode: lot,
        expiresAt: exp,
      })
      await invalidate()
      onDone(r)
    } catch (err) {
      const pe = err as { code?: string; detail?: string }
      if (pe.code === 'insufficient') {
        const c = defaults.consumption.find((x) => x.itemId === pe.detail)
        setBanner(`Não há ${c?.name.toLowerCase() ?? 'insumo'} suficiente no estoque para este consumo. Receba a compra que está a caminho ou ajuste o consumo e tente de novo.`)
      } else setBanner('Não foi possível concluir a produção. Nada foi alterado. Tente de novo.')
      setBusy(false)
    }
  }

  return (
    <>
      <main className={s.main} style={{ gap: 16, paddingTop: 16 }}>
        <div className={l.stack} style={{ gap: 8 }}>
          <Progress step={1} />
          <div className={l.strong} style={{ fontSize: 18 }}>{order.itemName}</div>
          <div className={l.sub}>{order.batches} {order.batches === 1 ? order.batchLabel : order.batchLabel === 'fornada' ? 'fornadas' : order.batchLabel === 'tacho' ? 'tachos' : 'lotes'} · previsto {order.plannedQty} un · {destinationText(order).toLowerCase()} · {orderLine(order).split(' · ').slice(2).join(', ')}</div>
        </div>

        <section className={l.section} aria-labelledby="cons-t">
          <h2 id="cons-t" className={l.h2}>Consumo real</h2>
          <div className={l.sub}>Ajuste se usou mais ou menos que a ficha.</div>
          <div className={l.linkList}>
            {defaults.consumption.map((c) => {
              const diff = Math.round((qty[c.itemId] - c.planned) * 100) / 100
              return (
                <div key={c.itemId} style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '12px 0', borderTop: '1px solid var(--linha)' }}>
                  <div className={l.spread}>
                    <span className={l.strong}>{c.name}</span>
                    {diff === 0 ? <StatusTag tone="success">Como previsto</StatusTag> : <StatusTag tone="warning">{diff > 0 ? '+' : '−'}{num(Math.abs(diff), c.decimals)} {c.unit}</StatusTag>}
                  </div>
                  <div className={l.spread}>
                    <span className={l.sub}>Previsto {num(c.planned, c.decimals)} {c.unit}</span>
                    <ConsumptionStepper name={c.name} unit={c.unit} value={qty[c.itemId]} step={c.step} decimals={c.decimals} onChange={(v) => setQty((q) => ({ ...q, [c.itemId]: v }))} />
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        <section className={l.section} aria-labelledby="rend-t">
          <h2 id="rend-t" className={l.h2}>Rendimento</h2>
          <div className={l.card} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div className={l.spread}>
              <span><b>Unidades boas</b><span className={l.small} style={{ display: 'block' }}>previsto {defaults.plannedQty} · {Math.round((good / defaults.plannedQty) * 100)}% do previsto</span></span>
              <QuantityStepper label="Unidades produzidas" variant="compact" value={good} min={0} max={defaults.plannedQty + 4} onChange={setGood} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 10 }}>
              <TextField label="Lote" value={lot} onChange={(e) => setLot(e.target.value)} error={errors.lot} />
              <TextField label="Validade" inputMode="numeric" value={expiry} onChange={(e) => setExpiry(e.target.value)} error={errors.expiry} />
            </div>
          </div>
        </section>

        <div className={l.card} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div className={l.sumRow}><span>Custo previsto / un</span><span style={{ color: 'var(--texto)' }}>{formatBRL(defaults.costPlannedCents)}</span></div>
          <div className={l.sumRow}><span>Custo real / un</span><span className={l.strong} style={{ color: 'var(--texto)' }}>{unitCost != null ? formatBRL(unitCost) : '—'}</span></div>
        </div>
        {banner && <Banner tone="error">{banner}</Banner>}
      </main>
      <Footer>
        <Button size="lg" fullWidth loading={busy} onClick={finish}>{busy ? 'Concluindo…' : 'Concluir produção'}</Button>
      </Footer>
    </>
  )
}

function ConsumptionStepper({ name, unit, value, step, decimals, onChange }: { name: string; unit: string; value: number; step: number; decimals: number; onChange: (v: number) => void }) {
  const round = (v: number) => Math.max(0, Math.round(v * 100) / 100)
  return (
    <div role="group" aria-label={`Consumo real de ${name}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 2 }}>
      <button type="button" aria-label="Diminuir" onClick={() => onChange(round(value - step))} disabled={value <= 0} style={{ width: 44, height: 44, borderRadius: 12, border: '1px solid var(--linha)', background: 'var(--fundo-loja)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icon name="remover" size={20} />
      </button>
      <div aria-live="polite" style={{ minWidth: 64, textAlign: 'center', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{num(value, decimals)} {unit}</div>
      <button type="button" aria-label="Aumentar" onClick={() => onChange(round(value + step))} style={{ width: 44, height: 44, borderRadius: 12, border: 0, background: 'var(--cor-terracota)', color: 'var(--superficie)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icon name="adicionar" size={20} />
      </button>
    </div>
  )
}

function Done({ order, result, onUndo }: { order: ProductionOrderView; result: FinishResult | null; onUndo: () => void }) {
  const { admin } = useServices()
  const invalidate = useInvalidateProduction()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(false)
  const undo = async () => {
    setBusy(true)
    setError(false)
    try {
      await admin.production.undoFinish(order.id)
      await invalidate()
      onUndo()
    } catch {
      setError(true)
      setBusy(false)
    }
  }
  const cost = result?.costPerUnitCents ?? order.costPerUnitCents
  const loss = order.plannedQty - (order.goodQty ?? 0)
  return (
    <>
      <main className={s.main} style={{ gap: 16, paddingTop: 24 }}>
        <Progress step={2} />
        <div className={l.stack} style={{ alignItems: 'center', gap: 8, textAlign: 'center' }}>
          <div className={l.disc} style={{ width: 64, height: 64, background: 'var(--sucesso-fundo)', color: 'var(--sucesso)' }} aria-hidden="true"><Icon name="confirmar" size={32} /></div>
          <h1 className={l.h1}>Produção concluída</h1>
        </div>
        <section className={l.section} aria-labelledby="ent-t">
          <div className={l.cardRow} style={{ alignItems: 'center', gap: 8 }}><Icon name="adicionar" size={20} /><b id="ent-t">Entrou no estoque</b></div>
          <div className={`${l.card} ${l.spread}`} style={{ alignItems: 'flex-start' }}>
            <span><b>{order.itemName}</b><span className={l.small} style={{ display: 'block' }}>Lote {order.lotCode}{order.expiresAt ? ` · vence ${formatBrDate(order.expiresAt)}` : ''}</span></span>
            <b className={l.tabular}>+ {order.goodQty} un</b>
          </div>
        </section>
        {result && result.consumed.length > 0 && (
          <section className={l.section} aria-labelledby="sai-t">
            <div className={l.cardRow} style={{ alignItems: 'center', gap: 8 }}><Icon name="remover" size={20} /><b id="sai-t">Saiu do estoque (insumos)</b></div>
            <div className={l.card} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {result.consumed.map((c) => <div key={c.name} className={l.sumRow}><span>{c.name}</span><span style={{ color: 'var(--texto)' }}>{c.qtyText}</span></div>)}
            </div>
          </section>
        )}
        <div className={l.card} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div className={l.sumRow}><span>Custo real / un</span><span style={{ color: 'var(--texto)' }}>{cost != null ? formatBRL(cost) : '—'}</span></div>
          <div className={l.sumRow}><span>Perda na produção</span><span style={{ color: 'var(--texto)' }}>{loss} un</span></div>
        </div>
        {error && <Banner tone="error">Não dá para corrigir: o lote já teve saída. Faça um ajuste de estoque.</Banner>}
      </main>
      <Footer>
        <ButtonLink href={`/gestao/estoque/${order.itemId}`} size="lg" fullWidth>Ver estoque do item</ButtonLink>
        {order.movementIds.length > 0 && <Button variant="ghost" fullWidth loading={busy} onClick={undo}>Corrigir apontamento</Button>}
      </Footer>
    </>
  )
}

function Detail({ order, result, setResult }: { order: ProductionOrderView; result: FinishResult | null; setResult: (r: FinishResult | null) => void }) {
  const { admin } = useServices()
  const invalidate = useInvalidateProduction()
  const defaults = useFinishDefaults(order.status === 'in_progress' ? order.id : undefined)
  const [busy, setBusy] = useState(false)

  // O resumo do consumo vem do `result`, guardado na página: ao concluir, a ordem é relida e esta tela recomeça.
  if (order.status === 'done') {
    return <Done order={order} result={result} onUndo={() => setResult(null)} />
  }
  if (order.status === 'planned') {
    const start = async () => {
      setBusy(true)
      await admin.production.start(order.id)
      await invalidate()
      setBusy(false)
    }
    return (
      <>
        <main className={s.main} style={{ gap: 16, paddingTop: 16 }}>
          <div className={l.stack} style={{ gap: 8 }}>
            <Progress step={0} />
            <div className={l.strong} style={{ fontSize: 18 }}>{order.itemName}</div>
            <div className={l.sub}>{orderLine(order)} · {destinationText(order).toLowerCase()}</div>
          </div>
          <Banner tone="warning">Ordem planejada. Quando começar a produção, toque em iniciar; o consumo real é apontado ao concluir.</Banner>
        </main>
        <Footer>
          <Button size="lg" fullWidth loading={busy} onClick={start}>{busy ? 'Iniciando…' : 'Iniciar produção'}</Button>
        </Footer>
      </>
    )
  }
  return (
    <QueryBoundary query={defaults} skeleton={<main className={s.main}><IndicatorSkeleton label="Carregando ordem" /></main>} errorTitle="Não foi possível carregar a ordem">
      {(d) => (d ? <Pointing order={order} defaults={d} onDone={setResult} /> : null)}
    </QueryBoundary>
  )
}

export function ProductionOrderPage() {
  const { id } = useParams()
  const query = useProductionOrder(id)
  const [result, setResult] = useState<FinishResult | null>(null)
  return (
    <QueryBoundary query={query} skeleton={<><ScreenHeader back="/gestao/producao" /><main className={s.main}><IndicatorSkeleton label="Carregando ordem" /></main></>} errorTitle="Não foi possível carregar a ordem">
      {(o) =>
        !o ? (
          <>
            <ScreenHeader back="/gestao/producao" />
            <main className={s.main}><EmptyState icon="producao" title="Ordem não encontrada" action={<ButtonLink href="/gestao/producao">Ver produção</ButtonLink>} /></main>
          </>
        ) : (
          <>
            <ScreenHeader title={o.id} back="/gestao/producao" />
            <Detail key={`${o.id}-${o.status}`} order={o} result={result} setResult={setResult} />
          </>
        )
      }
    </QueryBoundary>
  )
}
