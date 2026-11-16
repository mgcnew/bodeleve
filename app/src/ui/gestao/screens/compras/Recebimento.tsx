import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { Tag } from '@/components/Badges'
import { Box } from '@/components/Card'
import { Button, ButtonLink } from '@/components/Button'
import { EmptyState } from '@/components/Feedback'
import { RadioGroup, TextField } from '@/components/Field'
import { Icon } from '@/components/Icon'
import { QuantityStepper } from '@/components/QuantityStepper'
import { fullDate } from '@/domain/dates'
import { formatCents } from '@/domain/money'
import { entriesStore, itemsStore, purchasesStore, suppliersStore } from '@/services/gestao/backoffice'
import { receivePurchase, setPurchaseClosed, undoReceipt, type Receipt } from '@/services/gestao/purchases'
import o from '@/styles/ops.module.css'
import { Bar, SumRow } from '../../../shared/OpsBits'

type Line = { qty: number; lotCode: string; expiry: string }

/** Sugestão de código de lote: iniciais do item + dia e mês (ex.: LT-1120) */
function suggestLot(name: string) {
  const words = name.split(/\s+/).filter((w) => /^\p{L}{3,}$/u.test(w))
  const initials = (words.length > 1 ? words[0][0] + words[1][0] : (words[0] ?? 'LT').slice(0, 2)).toUpperCase()
  const d = new Date()
  return `${initials}-${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`
}

export function Recebimento() {
  const { id = '' } = useParams()
  const p = purchasesStore.useStore().find((x) => x.id === id)
  const items = itemsStore.useStore()
  const supplier = suppliersStore.useStore().find((s) => s.id === p?.supplierId)
  const entries = entriesStore.useStore()

  const [receipt, setReceipt] = useState<Receipt | null>(null)
  const [closed, setClosed] = useState<'open' | 'close'>('open')
  const [lines, setLines] = useState<Record<string, Line>>(() =>
    Object.fromEntries(
      (p?.items ?? []).map((i) => [i.itemId, { qty: Math.max(0, i.qty - i.receivedQty), lotCode: suggestLot(i.name), expiry: '' }]),
    ),
  )

  if (!p || !supplier) {
    return (
      <div className={o.screen}>
        <Bar title="Receber" back="/gestao/compras" />
        <EmptyState bare icon="compras" title="Pedido de compra não encontrado" action={<ButtonLink to="/gestao/compras">Ver compras</ButtonLink>} />
      </div>
    )
  }

  // na tela de sucesso o pedido já foi atualizado; os números vêm do recebimento guardado
  const base = receipt ? receipt.previous : p
  const pending = base.items.map((i) => ({ ...i, pending: Math.max(0, i.qty - i.receivedQty) })).filter((i) => i.pending > 0)
  const set = (itemId: string, patch: Partial<Line>) => setLines((l) => ({ ...l, [itemId]: { ...l[itemId], ...patch } }))
  const value = pending.reduce((n, i) => n + lines[i.itemId].qty * i.unitCostCents, 0)
  const complete = pending.filter((i) => lines[i.itemId].qty >= i.pending).length
  const missing = pending.filter((i) => lines[i.itemId].qty < i.pending)

  const confirm = () => {
    const r = receivePurchase(
      p.id,
      pending.map((i) => ({
        itemId: i.itemId,
        qty: lines[i.itemId].qty,
        lotCode: items.find((x) => x.id === i.itemId)?.tracksLots ? lines[i.itemId].lotCode : '',
        expiry: lines[i.itemId].expiry ? new Date(`${lines[i.itemId].expiry}T12:00:00`).toISOString() : null,
      })),
    )
    setReceipt(r)
    setClosed('open')
  }

  const undo = () => {
    if (receipt) undoReceipt(receipt)
    setReceipt(null)
  }

  if (receipt) {
    const entry = entries.find((e) => e.id === receipt.entryId)
    return (
      <div className={o.screen}>
        <Bar title={`Receber ${p.number}`} back={`/gestao/compras/${p.id}`} />
        <main className={`${o.main} ${o.narrow}`} style={{ paddingTop: 24, gap: 16 }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 8 }}>
            <div aria-hidden="true" style={{ width: 64, height: 64, borderRadius: 999, background: 'var(--cor-verde)', color: 'var(--superficie)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="confirmar" size={32} />
            </div>
            <h2 style={{ font: '700 24px/30px var(--fonte-titulo)' }}>Recebimento confirmado</h2>
          </div>
          <section className={o.section}>
            <div className={o.iconLine} style={{ alignItems: 'center' }}>
              <Icon name="estoque" size={20} />
              <b>Entrou no estoque</b>
            </div>
            <Box>
              {pending
                .filter((i) => lines[i.itemId].qty > 0)
                .map((i) => (
                  <div key={i.itemId} className={`${o.cardHead} ${o.num}`} style={{ padding: '10px 0', borderBottom: '1px solid var(--linha)' }}>
                    <div>
                      <div className={o.bold}>{i.name}</div>
                      {items.find((x) => x.id === i.itemId)?.tracksLots && (
                        <div className={o.small}>
                          Lote {lines[i.itemId].lotCode}
                          {lines[i.itemId].expiry && ` · vence ${fullDate(`${lines[i.itemId].expiry}T12:00:00`)}`}
                        </div>
                      )}
                    </div>
                    <div className={o.bold} style={{ color: 'var(--sucesso)' }}>
                      + {lines[i.itemId].qty} un
                    </div>
                  </div>
                ))}
            </Box>
          </section>
          {entry && (
            <section className={o.section}>
              <div className={o.iconLine} style={{ alignItems: 'center' }}>
                <Icon name="financeiro" size={20} />
                <b>Conta a pagar criada</b>
              </div>
              <div className={o.card}>
                <SumRow label={`${supplier.name} · ${p.paymentTerms.split(',')[0].toLowerCase()}`} value={formatCents(entry.amountCents)} />
                <SumRow label="Vencimento" value={fullDate(entry.dueDate)} />
              </div>
            </section>
          )}
          {missing.length > 0 && (
            <div style={{ padding: 16, borderRadius: 12, background: 'var(--atencao-fundo)' }}>
              <RadioGroup
                legend={`Faltaram ${missing.map((i) => `${i.pending - lines[i.itemId].qty} un de ${i.name}`).join(' e ')}. O que fazer?`}
                name="falta"
                value={closed}
                onChange={(v) => {
                  setClosed(v)
                  setPurchaseClosed(p.id, v === 'close')
                }}
                options={[
                  { value: 'open', title: 'Manter o restante em aberto no pedido' },
                  { value: 'close', title: 'Encerrar o pedido assim' },
                ]}
              />
            </div>
          )}
        </main>
        <div className={o.footer}>
          <ButtonLink to="/gestao/compras" size="l" block>
            Voltar às compras
          </ButtonLink>
          <Button variant="secondary" block onClick={undo}>
            Corrigir conferência
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className={o.screen}>
      <Bar title={`Receber ${p.number}`} back={`/gestao/compras/${p.id}`} />
      <main className={`${o.main} ${o.mainTop} ${o.narrow}`} style={{ gap: 12 }}>
        <p className={o.muted}>Confira cada item com a nota. Informe lote e validade como estão na embalagem.</p>
        {pending.map((i) => {
          const line = lines[i.itemId]
          const diff = line.qty - i.pending
          const tracks = items.find((x) => x.id === i.itemId)?.tracksLots
          return (
            <div key={i.itemId} className={o.card} style={{ gap: 12, padding: 16 }}>
              <div className={o.cardHead} style={{ alignItems: 'flex-start' }}>
                <div>
                  <div className={o.bold}>{i.name}</div>
                  <div className={`${o.small} ${o.num}`}>Pedido: {i.pending} un</div>
                </div>
                {diff === 0 ? <Tag tone="success">Confere</Tag> : <Tag tone="warning">{diff < 0 ? `Faltam ${-diff}` : `Sobram ${diff}`}</Tag>}
              </div>
              <div className={o.cardHead}>
                <span className={o.bold}>Recebido</span>
                <QuantityStepper label={`Quantidade recebida de ${i.name}`} value={line.qty} onChange={(q) => set(i.itemId, { qty: q })} />
              </div>
              {tracks && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 10 }}>
                  <TextField label="Lote" value={line.lotCode} onChange={(e) => set(i.itemId, { lotCode: e.target.value })} />
                  <TextField label="Validade" type="date" value={line.expiry} onChange={(e) => set(i.itemId, { expiry: e.target.value })} />
                </div>
              )}
            </div>
          )
        })}
        <div className={o.card}>
          <SumRow label="Valor da nota" value={formatCents(value)} />
          <SumRow label="Itens completos" value={`${complete} de ${pending.length}`} />
        </div>
      </main>
      <div className={o.footer}>
        <Button size="l" block onClick={confirm} disabled={value === 0}>
          Confirmar recebimento
        </Button>
      </div>
    </div>
  )
}
