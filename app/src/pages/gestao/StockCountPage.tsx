import { useState } from 'react'
import { Banner, Button, ButtonLink, Icon, IndicatorSkeleton, ListSkeleton, QuantityStepper, StatusTag } from '@/components'
import { formatBRL } from '@/lib/format'
import { useServices } from '@/services'
import { useAdminSession } from '@/store/admin'
import type { CountItem } from '@/services/types'
import { useCountAreas, useCountItems, useInvalidateStock } from '@/ui/gestao/queries'
import { Footer, QueryBoundary, ScreenHeader } from '@/ui/loja/parts'
import s from '@/ui/gestao/gestao.module.css'
import l from '@/ui/loja/loja.module.css'

const sign = (n: number) => (n > 0 ? '+' : n < 0 ? '−' : '')
const selectStyle = { height: 48, padding: '0 12px', borderRadius: 8, border: '1.5px solid var(--linha)', background: 'var(--superficie)', font: 'var(--corpo)' } as const

type Done = { batchId: string | null; adjustments: number; deltaUnits: number; deltaCostCents: number }

function Counting({ items, onDone }: { items: CountItem[]; onDone: (d: Done) => void }) {
  const { admin } = useServices()
  const user = useAdminSession((x) => x.user)
  const invalidate = useInvalidateStock()
  const [counted, setCounted] = useState<Record<string, number>>(() => Object.fromEntries(items.map((i) => [i.itemId, i.system])))
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(false)

  const diffs = items.map((i) => ({ item: i, diff: (counted[i.itemId] ?? i.system) - i.system }))
  const withDiff = diffs.filter((d) => d.diff !== 0)
  const units = withDiff.reduce((a, d) => a + d.diff, 0)
  const cost = withDiff.reduce((a, d) => a + d.diff * d.item.unitCostCents, 0)

  const apply = async () => {
    setBusy(true)
    setError(false)
    try {
      const r = await admin.stock.applyCount(items.map((i) => ({ itemId: i.itemId, counted: counted[i.itemId] ?? i.system })), user?.name ?? 'Equipe')
      await invalidate()
      onDone(r)
    } catch {
      setError(true)
      setBusy(false)
    }
  }

  return (
    <>
      <div className={l.sub}>Conte o que está na prateleira e ajuste o número de cada item. Itens reservados para pedidos também contam.</div>
      <div className={l.linkList}>
        {diffs.map(({ item, diff }) => (
          <div key={item.itemId} style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '12px 0', borderTop: '1px solid var(--linha)' }}>
            <div className={l.spread}>
              <span className={l.strong}>{item.name}</span>
              {diff === 0 ? <StatusTag tone="success">Confere</StatusTag> : <StatusTag tone="warning">{diff > 0 ? 'Sobra' : 'Falta'} {Math.abs(diff)}</StatusTag>}
            </div>
            <div className={l.spread}>
              <span className={l.sub}>Sistema: {item.system} un</span>
              <QuantityStepper label={`Contado de ${item.name}`} variant="compact" value={counted[item.itemId] ?? item.system} min={0} onChange={(n) => setCounted((c) => ({ ...c, [item.itemId]: n }))} />
            </div>
          </div>
        ))}
      </div>
      <div className={l.card} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div className={l.sumRow}><span>Itens com diferença</span><span style={{ color: 'var(--texto)' }}>{withDiff.length}</span></div>
        <div className={l.sumRow}><span>Diferença em unidades</span><span style={{ color: 'var(--texto)' }}>{sign(units)}{Math.abs(units)} un</span></div>
        <div className={`${l.sumRow} ${l.sumTotal}`}><span>Diferença em custo</span><span>{sign(cost)} {formatBRL(Math.abs(cost))}</span></div>
      </div>
      {error && <Banner tone="error">Não foi possível aplicar a contagem. Nada foi alterado. Tente de novo.</Banner>}
      <Footer>
        <Button size="lg" fullWidth loading={busy} onClick={apply}>{busy ? 'Aplicando…' : 'Aplicar contagem'}</Button>
      </Footer>
    </>
  )
}

export function StockCountPage() {
  const { admin } = useServices()
  const user = useAdminSession((x) => x.user)
  const invalidate = useInvalidateStock()
  const areas = useCountAreas()
  const [area, setArea] = useState<string | null>(null)
  const [done, setDone] = useState<Done | null>(null)
  const [undoError, setUndoError] = useState(false)
  const chosen = area ?? areas.data?.[0]?.id
  const items = useCountItems(chosen)

  const undo = async () => {
    if (!done?.batchId) return setDone(null)
    try {
      await admin.stock.undoCount(done.batchId, user?.name ?? 'Equipe')
      await invalidate()
      setDone(null)
    } catch {
      setUndoError(true)
    }
  }

  return (
    <>
      <ScreenHeader title="Contar estoque" back="/gestao/estoque" />
      {done ? (
        <>
          <main className={s.main} style={{ alignItems: 'center', gap: 12, paddingTop: 48, textAlign: 'center' }}>
            <div className={l.disc} style={{ width: 64, height: 64, background: 'var(--sucesso-fundo)', color: 'var(--sucesso)' }} aria-hidden="true"><Icon name="confirmar" size={32} /></div>
            <h1 className={l.h1}>Contagem aplicada</h1>
            <div className={l.sub}>
              {done.adjustments === 0
                ? 'Tudo conferiu. Nenhum ajuste foi feito.'
                : `${done.adjustments} ${done.adjustments === 1 ? 'ajuste lançado' : 'ajustes lançados'} · ${sign(done.deltaCostCents)} ${formatBRL(Math.abs(done.deltaCostCents))} em custo`}
            </div>
            {undoError && <Banner tone="error">Não foi possível corrigir: o estoque já mudou. Faça um ajuste.</Banner>}
          </main>
          <Footer>
            <ButtonLink href="/gestao/estoque" size="lg" fullWidth>Voltar ao estoque</ButtonLink>
            {done.batchId && <Button variant="ghost" fullWidth onClick={undo}>Corrigir contagem</Button>}
          </Footer>
        </>
      ) : (
        <main className={s.main} style={{ gap: 16, paddingTop: 16 }}>
          <QueryBoundary query={areas} skeleton={<IndicatorSkeleton label="Carregando áreas" />} errorTitle="Não foi possível carregar as áreas">
            {(list) => (
              <div className={l.stack} style={{ gap: 6 }}>
                <label htmlFor="area" className={l.strong} style={{ fontSize: 14 }}>O que contar</label>
                <select id="area" value={chosen} onChange={(e) => setArea(e.target.value)} style={selectStyle}>
                  {list.map((a) => <option key={a.id} value={a.id}>{a.name} · {a.count} {a.count === 1 ? 'item' : 'itens'}</option>)}
                </select>
              </div>
            )}
          </QueryBoundary>
          <QueryBoundary query={items} skeleton={<ListSkeleton rows={5} label="Carregando itens" />} errorTitle="Não foi possível carregar os itens">
            {(list) => <Counting key={chosen} items={list} onDone={setDone} />}
          </QueryBoundary>
        </main>
      )}
    </>
  )
}
