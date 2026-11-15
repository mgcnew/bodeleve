import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Banner, Button, ButtonLink, EmptyState, Icon, IndicatorSkeleton, QuantityStepper, Segmented } from '@/components'
import type { AdjustKind } from '@/domain/stock'
import { formatBrDate } from '@/domain/purchasing'
import { formatBRL } from '@/lib/format'
import { useServices } from '@/services'
import { useAdminSession } from '@/store/admin'
import { useInvalidateStock, useStockItem, useStockOverview } from '@/ui/gestao/queries'
import { Footer, QueryBoundary, RadioCard, ScreenHeader } from '@/ui/loja/parts'
import type { StockItemView } from '@/services/types'
import s from '@/ui/gestao/gestao.module.css'
import l from '@/ui/loja/loja.module.css'

const kinds: Array<{ value: AdjustKind; title: string; detail: string }> = [
  { value: 'loss', title: 'Perda', detail: 'Vencido, danificado, estragado' },
  { value: 'internal', title: 'Consumo interno', detail: 'Usado na casa, degustação' },
  { value: 'correction', title: 'Correção de contagem', detail: 'O sistema estava errado' },
]
const reasons = ['Embalagem danificada', 'Vencido', 'Estragou', 'Outro']
const selectStyle = { height: 48, padding: '0 12px', borderRadius: 8, border: '1.5px solid var(--linha)', background: 'var(--superficie)', font: 'var(--corpo)' } as const

type Done = { movementId: string; costCents: number; physicalBefore: number; physicalAfter: number; lotCode: string; itemName: string; qty: number; add: boolean }

function Form({ item }: { item: StockItemView }) {
  const { admin } = useServices()
  const user = useAdminSession((x) => x.user)
  const invalidate = useInvalidateStock()
  const [kind, setKind] = useState<AdjustKind>('loss')
  const [lotId, setLotId] = useState(item.lots[0]?.id ?? '')
  const [qty, setQty] = useState(1)
  const [direction, setDirection] = useState<'out' | 'in'>('out')
  const [reason, setReason] = useState(reasons[0])
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState<'save' | 'undo' | null>(null)
  const [done, setDone] = useState<Done | null>(null)

  const lot = item.lots.find((x) => x.id === lotId)
  const adding = kind === 'correction' && direction === 'in'
  const max = adding ? 9999 : lot?.balance ?? 0
  const unitCost = useMemo(() => item.unitCostCents ?? 0, [item.unitCostCents])
  const after = item.physical + (adding ? qty : -qty)

  const save = async () => {
    setError(null)
    setBusy('save')
    try {
      const r = await admin.stock.adjust({ itemId: item.itemId, lotId, qty, kind, reason: kind === 'loss' ? reason : '', add: adding, by: user?.name ?? 'Equipe' })
      await invalidate()
      setDone({ ...r, qty, add: adding })
    } catch (e) {
      setError((e as Error).message === 'insufficient' ? 'O lote não tem essa quantidade. Escolha outro lote ou diminua o número.' : 'Não foi possível registrar. Nada foi alterado. Tente de novo.')
    }
    setBusy(null)
  }
  const undo = async () => {
    if (!done) return
    setBusy('undo')
    try {
      await admin.stock.undoMovement(done.movementId, user?.name ?? 'Equipe')
      await invalidate()
      setDone(null)
    } catch {
      setError('Não foi possível desfazer. Faça um novo ajuste para corrigir.')
    }
    setBusy(null)
  }

  if (done) {
    return (
      <>
        <main className={s.main} style={{ alignItems: 'center', gap: 12, paddingTop: 48, textAlign: 'center' }}>
          <div className={l.disc} style={{ width: 64, height: 64, background: 'var(--sucesso-fundo)', color: 'var(--sucesso)' }} aria-hidden="true"><Icon name="confirmar" size={32} /></div>
          <h1 className={l.h1}>{done.add ? 'Entrada registrada' : 'Saída registrada'}</h1>
          <div className={l.sub}>
            {done.qty} un de {done.itemName}{done.add ? '' : ` · ${formatBRL(done.costCents)} de custo`} · lote {done.lotCode}
          </div>
          {error && <Banner tone="error">{error}</Banner>}
        </main>
        <Footer>
          <ButtonLink href={`/gestao/estoque/${item.itemId}`} size="lg" fullWidth>Voltar ao item</ButtonLink>
          <Button variant="ghost" fullWidth loading={busy === 'undo'} onClick={undo}>Desfazer</Button>
        </Footer>
      </>
    )
  }

  return (
    <>
      <main className={s.main} style={{ gap: 16, paddingTop: 16 }}>
        <div>
          <div className={l.strong} style={{ fontSize: 18 }}>{item.name}</div>
          <div className={l.sub}>Físico {item.physical} un · disponível {item.available} un</div>
        </div>
        <fieldset className={l.fieldset}>
          <legend className={l.legend}>O que aconteceu?</legend>
          {kinds.map((k) => <RadioCard key={k.value} name="tipo" value={k.value} checked={kind === k.value} onChange={(v) => setKind(v as AdjustKind)} title={k.title} detail={k.detail} />)}
        </fieldset>
        {kind === 'correction' && (
          <Segmented label="Sentido da correção" value={direction} onChange={setDirection} options={[{ value: 'out', label: 'Tirar do estoque' }, { value: 'in', label: 'Somar ao estoque' }]} />
        )}
        <div className={l.stack} style={{ gap: 6 }}>
          <label htmlFor="lote" className={l.strong} style={{ fontSize: 14 }}>Lote</label>
          <select id="lote" value={lotId} onChange={(e) => { setLotId(e.target.value); setQty(1) }} style={selectStyle}>
            {item.lots.map((x) => (
              <option key={x.id} value={x.id}>{x.code}{x.expiresAt ? ` · vence ${formatBrDate(x.expiresAt).slice(0, 5)}` : ''} · {x.balance} un</option>
            ))}
          </select>
        </div>
        <div className={`${l.card} ${l.spread}`}>
          <span className={l.strong}>{adding ? 'Quantidade que entrou' : 'Quantidade que saiu'}</span>
          <QuantityStepper label="Quantidade" variant="compact" value={qty} min={1} max={max} onChange={setQty} />
        </div>
        {kind === 'loss' && (
          <div className={l.stack} style={{ gap: 6 }}>
            <label htmlFor="motivo" className={l.strong} style={{ fontSize: 14 }}>Motivo</label>
            <select id="motivo" value={reason} onChange={(e) => setReason(e.target.value)} style={selectStyle}>
              {reasons.map((r) => <option key={r}>{r}</option>)}
            </select>
          </div>
        )}
        <div className={l.card} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div className={l.sumRow}><span>Saldo físico</span><span style={{ color: 'var(--texto)' }}>{item.physical} → {after} un</span></div>
          {!adding && <div className={l.sumRow}><span>{kind === 'loss' ? 'Custo da perda' : 'Custo'}</span><span style={{ color: 'var(--texto)' }}>{formatBRL(qty * unitCost)}</span></div>}
        </div>
        {error && <Banner tone="error">{error}</Banner>}
      </main>
      <Footer>
        <Button size="lg" fullWidth loading={busy === 'save'} disabled={!lot} onClick={save}>{busy === 'save' ? 'Registrando…' : adding ? 'Registrar entrada' : 'Registrar saída'}</Button>
      </Footer>
    </>
  )
}

/** Ajuste, perda, consumo interno e correção de contagem. Sem item na rota, a pessoa escolhe o item primeiro. */
export function StockAdjustPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const overview = useStockOverview()
  const query = useStockItem(id)
  return (
    <>
      <ScreenHeader title="Ajustar estoque" back={id ? `/gestao/estoque/${id}` : '/gestao/estoque'} />
      {!id ? (
        <main className={s.main} style={{ gap: 16, paddingTop: 16 }}>
          <QueryBoundary query={overview} skeleton={<IndicatorSkeleton label="Carregando itens" />} errorTitle="Não foi possível carregar o estoque">
            {(o) => (
              <div className={l.stack} style={{ gap: 6 }}>
                <label htmlFor="item" className={l.strong} style={{ fontSize: 14 }}>Qual item?</label>
                <select id="item" defaultValue="" onChange={(e) => e.target.value && navigate(`/gestao/estoque/${e.target.value}/ajuste`)} style={selectStyle}>
                  <option value="" disabled>Escolha o item</option>
                  {o.rows.filter((r) => r.physical > 0).map((r) => <option key={r.itemId} value={r.itemId}>{r.name} · {r.physical} un</option>)}
                </select>
              </div>
            )}
          </QueryBoundary>
        </main>
      ) : (
        <QueryBoundary query={query} skeleton={<main className={s.main}><IndicatorSkeleton label="Carregando item" /></main>} errorTitle="Não foi possível carregar o item">
          {(item) =>
            !item ? (
              <main className={s.main}><EmptyState icon="estoque" title="Item não encontrado" action={<ButtonLink href="/gestao/estoque">Ver estoque</ButtonLink>} /></main>
            ) : item.lots.length === 0 ? (
              <main className={s.main}><EmptyState icon="estoque" title="Este item não tem lote com saldo" description="Para somar ao estoque, receba uma compra ou conte o estoque." action={<ButtonLink href={`/gestao/estoque/${item.itemId}`}>Voltar ao item</ButtonLink>} /></main>
            ) : (
              <Form key={item.itemId} item={item} />
            )
          }
        </QueryBoundary>
      )}
    </>
  )
}
