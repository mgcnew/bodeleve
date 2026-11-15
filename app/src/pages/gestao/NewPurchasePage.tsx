import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Banner, Button, IndicatorSkeleton, QuantityStepper, StatusTag, TextField, useToast } from '@/components'
import { paymentTerms, formatBrDate, parseBrDate, type PaymentTermId } from '@/domain/purchasing'
import { formatBRL } from '@/lib/format'
import { useServices } from '@/services'
import type { PurchaseSuggestion } from '@/services/types'
import { useInvalidatePurchasing, useSuggestions, useSuppliers } from '@/ui/gestao/queries'
import { Footer, QueryBoundary, ScreenHeader } from '@/ui/loja/parts'
import s from '@/ui/gestao/gestao.module.css'
import l from '@/ui/loja/loja.module.css'

function Form({ supplierId, suggestions, defaultPayment, leadDays }: { supplierId: string; suggestions: PurchaseSuggestion[]; defaultPayment: PaymentTermId; leadDays: number }) {
  const navigate = useNavigate()
  const toast = useToast()
  const { admin } = useServices()
  const invalidate = useInvalidatePurchasing()
  const [qty, setQty] = useState<Record<string, number>>(() => Object.fromEntries(suggestions.map((x) => [x.itemId, x.suggestedQty])))
  const [arrival, setArrival] = useState(() => formatBrDate(new Date(Date.now() + leadDays * 86_400_000).toISOString()))
  const [payment, setPayment] = useState<PaymentTermId>(defaultPayment)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const units = suggestions.reduce((a, x) => a + (qty[x.itemId] ?? 0), 0)
  const total = suggestions.reduce((a, x) => a + (qty[x.itemId] ?? 0) * x.lastCostCents, 0)
  const expectedAt = parseBrDate(arrival)

  const send = async () => {
    setError(null)
    if (units === 0) return setError('Escolha a quantidade de pelo menos um item.')
    if (!expectedAt) return setError('Previsão de chegada inválida. Use dia/mês/ano.')
    setBusy(true)
    try {
      const { order } = await admin.purchasing.send({ supplierId, expectedAt, payment, items: suggestions.map((x) => ({ itemId: x.itemId, qty: qty[x.itemId] ?? 0 })) })
      await invalidate()
      toast.show({ message: `${order.id} salvo como Enviado. A mensagem foi guardada, mas não enviada nesta versão.` })
      navigate(`/gestao/compras/${order.id}`, { replace: true })
    } catch {
      setError('Não foi possível salvar o pedido. Nada foi enviado. Tente de novo.')
      setBusy(false)
    }
  }

  return (
    <>
      <section className={l.section} aria-labelledby="itens-t">
        <div className={l.spread} style={{ alignItems: 'baseline' }}>
          <h2 id="itens-t" className={l.h2}>Itens</h2>
          <span className={l.small}>Sugestão pelo estoque mínimo</span>
        </div>
        <div className={l.linkList}>
          {suggestions.map((x) => (
            <div key={x.itemId} style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: '14px 0', borderTop: '1px solid var(--linha)' }}>
              <div className={l.spread} style={{ alignItems: 'flex-start' }}>
                <div>
                  <div className={l.strong}>{x.name}</div>
                  <div className={`${l.small} ${l.tabular}`}>
                    Estoque {x.balance} un · {x.level === 'ok' ? 'ok' : `mínimo ${x.min}`} · último custo {formatBRL(x.lastCostCents)}
                  </div>
                </div>
                {x.level !== 'ok' && <StatusTag tone="warning">{x.level === 'out' ? 'Sem estoque' : 'Estoque baixo'}</StatusTag>}
              </div>
              <div className={l.spread}>
                <QuantityStepper label={`Quantidade de ${x.name}`} value={qty[x.itemId] ?? 0} min={0} variant="compact" onChange={(n) => setQty((q) => ({ ...q, [x.itemId]: n }))} />
                <span className={`${l.strong} ${l.tabular}`}>{formatBRL((qty[x.itemId] ?? 0) * x.lastCostCents)}</span>
              </div>
            </div>
          ))}
        </div>
      </section>
      <TextField label="Previsão de chegada" inputMode="numeric" placeholder="dd/mm/aaaa" value={arrival} onChange={(e) => setArrival(e.target.value)} />
      <div className={l.stack} style={{ gap: 6 }}>
        <label htmlFor="cond" className={l.strong} style={{ fontSize: 14 }}>Pagamento</label>
        <select id="cond" value={payment} onChange={(e) => setPayment(e.target.value as PaymentTermId)} style={{ height: 48, padding: '0 12px', borderRadius: 8, border: '1.5px solid var(--linha)', background: 'var(--superficie)', font: 'var(--corpo)' }}>
          {Object.entries(paymentTerms).map(([id, t]) => <option key={id} value={id}>{t.label}</option>)}
        </select>
      </div>
      <div className={l.card} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div className={l.sumRow}><span>Itens</span><span>{units} un</span></div>
        <div className={`${l.sumRow} ${l.sumTotal}`}><span>Total previsto</span><span>{formatBRL(total)}</span></div>
      </div>
      {error && <Banner tone="error">{error}</Banner>}
      <Footer>
        <Button size="lg" fullWidth loading={busy} onClick={send}>{busy ? 'Enviando…' : 'Enviar ao fornecedor'}</Button>
        <div className={l.small} style={{ textAlign: 'center' }}>Salva o pedido como “Enviado” e guarda a mensagem para o fornecedor. O envio pelo WhatsApp ainda não está ligado nesta versão.</div>
      </Footer>
    </>
  )
}

export function NewPurchasePage() {
  const [params, setParams] = useSearchParams()
  const suppliers = useSuppliers()
  const chosen = params.get('fornecedor') ?? suppliers.data?.[0]?.id
  const suggestions = useSuggestions(chosen)
  const supplier = suppliers.data?.find((x) => x.id === chosen)
  return (
    <>
      <ScreenHeader title="Novo pedido de compra" back="/gestao/compras" />
      <main className={s.main} style={{ gap: 16, paddingTop: 16 }}>
        <QueryBoundary query={suppliers} skeleton={<IndicatorSkeleton label="Carregando fornecedores" />} errorTitle="Não foi possível carregar os fornecedores">
          {(list) => (
            <>
              <div className={l.stack} style={{ gap: 6 }}>
                <label htmlFor="forn" className={l.strong} style={{ fontSize: 14 }}>Fornecedor</label>
                <select id="forn" value={chosen ?? ''} onChange={(e) => setParams({ fornecedor: e.target.value }, { replace: true })} style={{ height: 48, padding: '0 12px', borderRadius: 8, border: '1.5px solid var(--linha)', background: 'var(--superficie)', font: 'var(--corpo)' }}>
                  {list.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
                </select>
              </div>
              <QueryBoundary query={suggestions} skeleton={<IndicatorSkeleton label="Carregando itens" />} errorTitle="Não foi possível carregar os itens">
                {(items) =>
                  supplier ? <Form key={supplier.id} supplierId={supplier.id} suggestions={items} defaultPayment={supplier.defaultPayment} leadDays={5} /> : null
                }
              </QueryBoundary>
            </>
          )}
        </QueryBoundary>
      </main>
    </>
  )
}
