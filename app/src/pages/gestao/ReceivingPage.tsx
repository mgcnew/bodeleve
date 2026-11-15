import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Banner, Button, ButtonLink, EmptyState, Icon, IndicatorSkeleton, QuantityStepper, StatusTag, TextField } from '@/components'
import { formatBrDate, isOpen, parseBrDate, type ReceiptLine } from '@/domain/purchasing'
import { ReceivingError, type ReceiveResult } from '@/domain/receiving'
import { formatBRL } from '@/lib/format'
import { useServices } from '@/services'
import type { PurchaseView } from '@/services/types'
import { useInvalidatePurchasing, usePurchase } from '@/ui/gestao/queries'
import { Footer, QueryBoundary, ScreenHeader } from '@/ui/loja/parts'
import s from '@/ui/gestao/gestao.module.css'
import l from '@/ui/loja/loja.module.css'

type Fields = Record<string, { qty: number; lot: string; expiry: string }>

function Conferring({ order, onDone }: { order: PurchaseView; onDone: (r: ReceiveResult) => void }) {
  const { admin } = useServices()
  const invalidate = useInvalidatePurchasing()
  const [fields, setFields] = useState<Fields>(() =>
    Object.fromEntries(order.items.map((i) => [i.itemId, { qty: i.qty - i.receivedQty, lot: '', expiry: '' }])),
  )
  const [errors, setErrors] = useState<Record<string, { qty?: string; lot?: string; expiresAt?: string }>>({})
  const [failed, setFailed] = useState(false)
  const [busy, setBusy] = useState(false)
  const set = (id: string, patch: Partial<Fields[string]>) => setFields((f) => ({ ...f, [id]: { ...f[id], ...patch } }))

  const total = order.items.reduce((a, i) => a + (fields[i.itemId]?.qty ?? 0) * i.unitCostCents, 0)
  const complete = order.items.filter((i) => i.receivedQty + (fields[i.itemId]?.qty ?? 0) >= i.qty).length

  const confirm = async () => {
    setFailed(false)
    const lines: ReceiptLine[] = []
    const local: typeof errors = {}
    for (const i of order.items) {
      const f = fields[i.itemId]
      const expiresAt = f.expiry.trim() ? parseBrDate(f.expiry) : null
      if (f.expiry.trim() && !expiresAt) local[i.itemId] = { expiresAt: 'Data inválida. Use dia/mês/ano.' }
      lines.push({ itemId: i.itemId, qty: f.qty, lot: f.lot, expiresAt })
    }
    setErrors(local)
    if (Object.keys(local).length) return
    setBusy(true)
    try {
      const r = await admin.purchasing.receive(order.id, { lines, closeShort: false })
      await invalidate()
      onDone(r)
    } catch (e) {
      if (e instanceof ReceivingError && e.code === 'invalid_lines') setErrors(e.errors ?? {})
      else setFailed(true)
      setBusy(false)
    }
  }

  return (
    <>
      <main className={s.main} style={{ gap: 12, paddingTop: 16 }}>
        <div className={l.sub}>Confira cada item com a nota. Informe lote e validade como estão na embalagem.</div>
        {order.items.map((i) => {
          const f = fields[i.itemId]
          const remaining = i.qty - i.receivedQty
          const diff = f.qty - remaining
          const e = errors[i.itemId] ?? {}
          return (
            <section key={i.itemId} className={l.card} style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: 16 }} aria-label={i.name}>
              <div className={l.spread} style={{ alignItems: 'flex-start' }}>
                <div>
                  <div className={l.strong}>{i.name}</div>
                  <div className={l.small}>Pedido: {remaining} un</div>
                </div>
                {diff === 0 ? <StatusTag tone="success">Confere</StatusTag> : <StatusTag tone="warning">{diff < 0 ? `Faltam ${-diff}` : `Sobram ${diff}`}</StatusTag>}
              </div>
              <div className={l.spread}>
                <span id={`rl-${i.itemId}`} className={l.strong}>Recebido</span>
                <QuantityStepper label={`Quantidade recebida de ${i.name}`} variant="compact" value={f.qty} min={0} onChange={(n) => set(i.itemId, { qty: n })} />
              </div>
              {e.qty && <Banner tone="error">{e.qty}</Banner>}
              <div className={s.fieldPair} style={{ display: 'grid', gridTemplateColumns: i.tracksExpiry ? 'repeat(2, minmax(0, 1fr))' : '1fr', gap: 10 }}>
                <TextField label="Lote" value={f.lot} onChange={(ev) => set(i.itemId, { lot: ev.target.value })} error={e.lot} placeholder="Ex.: LT-1120" />
                {i.tracksExpiry && (
                  <TextField label="Validade" inputMode="numeric" value={f.expiry} onChange={(ev) => set(i.itemId, { expiry: ev.target.value })} error={e.expiresAt} placeholder="dd/mm/aaaa" />
                )}
              </div>
            </section>
          )
        })}
        <div className={l.card} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div className={l.sumRow}><span>Valor da nota</span><span className={l.strong} style={{ color: 'var(--texto)' }}>{formatBRL(total)}</span></div>
          <div className={l.sumRow}><span>Itens completos</span><span>{complete} de {order.items.length}</span></div>
        </div>
        {failed && <Banner tone="error">Não foi possível confirmar o recebimento. Nada foi alterado. Tente de novo.</Banner>}
      </main>
      <Footer>
        <Button size="lg" fullWidth loading={busy} onClick={confirm}>{busy ? 'Confirmando recebimento…' : 'Confirmar recebimento'}</Button>
      </Footer>
    </>
  )
}

function Done({ order, result, onUndo }: { order: PurchaseView; result: ReceiveResult; onUndo: () => void }) {
  const { admin } = useServices()
  const navigate = useNavigate()
  const invalidate = useInvalidatePurchasing()
  const [choice, setChoice] = useState<'keep' | 'close'>('keep')
  const [undoError, setUndoError] = useState(false)
  const [busy, setBusy] = useState<'undo' | 'leave' | null>(null)
  const missing = result.shortfall
  const text = `Faltaram ${missing.map((m) => `${m.missing} un de ${m.name.replace(/ \d+ ?(g|kg|ml|L)$/i, '')}`).join(' e ')}. O que fazer?`

  // A escolha vale ao sair: "manter em aberto" não muda nada; "encerrar" fecha o pedido com falta.
  const leave = async () => {
    setBusy('leave')
    if (missing.length > 0 && choice === 'close') await admin.purchasing.closeShort(order.id)
    await invalidate()
    navigate('/gestao/compras')
  }
  const undo = async () => {
    setBusy('undo')
    setUndoError(false)
    try {
      await admin.purchasing.reverseReceipt(order.id)
      await invalidate()
      onUndo()
    } catch {
      setUndoError(true)
      setBusy(null)
    }
  }

  return (
    <>
      <main className={s.main} style={{ gap: 16, paddingTop: 24 }}>
        <div className={l.stack} style={{ alignItems: 'center', gap: 8, textAlign: 'center' }}>
          <div className={l.disc} style={{ width: 64, height: 64, background: 'var(--sucesso-fundo)', color: 'var(--sucesso)' }} aria-hidden="true"><Icon name="confirmar" size={32} /></div>
          <h1 className={l.h1}>Recebimento confirmado</h1>
        </div>

        <section className={l.section} aria-labelledby="ent-t">
          <div className={l.cardRow} style={{ alignItems: 'center', gap: 8 }}><Icon name="estoque" size={20} /><b id="ent-t">Entrou no estoque</b></div>
          <div className={l.linkList}>
            {result.entered.map((e) => (
              <div key={`${e.itemId}-${e.lotCode}`} className={l.spread} style={{ padding: '10px 0', borderTop: '1px solid var(--linha)', alignItems: 'flex-start' }}>
                <div>
                  <div className={l.strong}>{e.itemName}</div>
                  <div className={l.small}>Lote {e.lotCode}{e.expiresAt ? ` · vence ${formatBrDate(e.expiresAt)}` : ''}</div>
                </div>
                <div className={`${l.strong} ${l.tabular}`}>+ {e.qty} un</div>
              </div>
            ))}
          </div>
        </section>

        {result.payable && (
          <section className={l.section} aria-labelledby="conta-t">
            <div className={l.cardRow} style={{ alignItems: 'center', gap: 8 }}><Icon name="financeiro" size={20} /><b id="conta-t">Conta a pagar criada</b></div>
            <div className={l.card} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div className={l.sumRow}><span>{result.payable.description}</span><span className={l.strong} style={{ color: 'var(--texto)' }}>{formatBRL(result.payable.amountCents)}</span></div>
              <div className={l.sumRow}><span>Vencimento</span><span>{formatBrDate(result.payable.dueAt)}</span></div>
            </div>
          </section>
        )}

        {missing.length > 0 && (
          <fieldset className={`${l.card} ${l.fieldset}`} style={{ padding: 16 }}>
            <legend className={l.legend} style={{ padding: 0 }}>{text}</legend>
            <label className={l.option} style={{ border: 0, padding: 0, minHeight: 44 }}>
              <input type="radio" name="falta" checked={choice === 'keep'} onChange={() => setChoice('keep')} />
              <span>Manter o restante em aberto no pedido</span>
            </label>
            <label className={l.option} style={{ border: 0, padding: 0, minHeight: 44 }}>
              <input type="radio" name="falta" checked={choice === 'close'} onChange={() => setChoice('close')} />
              <span>Encerrar o pedido assim</span>
            </label>
          </fieldset>
        )}
        {undoError && <Banner tone="error">Não dá para corrigir: a conta já foi paga ou o lote já teve saída. Use o ajuste de estoque.</Banner>}
      </main>
      <Footer>
        <Button size="lg" fullWidth loading={busy === 'leave'} disabled={busy === 'undo'} onClick={leave}>Voltar às compras</Button>
        <Button variant="ghost" fullWidth loading={busy === 'undo'} disabled={busy === 'leave'} onClick={undo}>Corrigir conferência</Button>
      </Footer>
    </>
  )
}

export function ReceivingPage() {
  const { id } = useParams()
  const query = usePurchase(id)
  const [result, setResult] = useState<ReceiveResult | null>(null)
  return (
    <QueryBoundary query={query} skeleton={<><ScreenHeader back="/gestao/compras" /><main className={s.main}><IndicatorSkeleton label="Carregando pedido de compra" /></main></>} errorTitle="Não foi possível carregar o pedido">
      {(o) =>
        !o ? (
          <>
            <ScreenHeader back="/gestao/compras" />
            <main className={s.main}><EmptyState icon="compras" title="Pedido de compra não encontrado" action={<ButtonLink href="/gestao/compras">Ver compras</ButtonLink>} /></main>
          </>
        ) : (
          <>
            <ScreenHeader title={`Receber ${o.id}`} back={`/gestao/compras/${o.id}`} />
            {result ? (
              <Done order={o} result={result} onUndo={() => setResult(null)} />
            ) : !isOpen(o) ? (
              <main className={s.main}><EmptyState icon="confirmar" title="Este pedido já foi recebido" description="Para corrigir, use o ajuste de estoque." action={<ButtonLink href={`/gestao/compras/${o.id}`}>Ver pedido</ButtonLink>} /></main>
            ) : (
              <Conferring order={o} onDone={setResult} />
            )}
          </>
        )
      }
    </QueryBoundary>
  )
}
