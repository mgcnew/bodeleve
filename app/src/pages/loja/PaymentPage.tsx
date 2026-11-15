import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { Button, TextField } from '@/components'
import { storefront } from '@/config/storefront'
import { parseChangeFor } from '@/domain/checkout'
import { formatBRL } from '@/lib/format'
import { useBag, useCheckout } from '@/store/bag'
import { useBagSummary } from '@/ui/loja/useBagSummary'
import { Footer, RadioCard, ScreenHeader, StepProgress } from '@/ui/loja/parts'
import type { PaymentMethod } from '@/domain/types'
import s from '@/ui/loja/loja.module.css'

export function PaymentPage() {
  const navigate = useNavigate()
  const empty = useBag((b) => Object.keys(b.items).length === 0)
  const { totals } = useBagSummary()
  const { paymentMethod, changeFor, setPayment, setChangeFor } = useCheckout()
  const [tried, setTried] = useState(false)
  const change = paymentMethod === 'cash' ? parseChangeFor(changeFor, totals.totalCents) : { cents: null as number | null, error: undefined }

  if (empty) return <Navigate to="/sacola" replace />

  const next = () => {
    setTried(true)
    if (change.error) return
    navigate('/finalizar/revisao')
  }
  const pick = (v: string) => setPayment(v as PaymentMethod)

  return (
    <>
      <ScreenHeader title="Finalizar pedido" back="/finalizar/entrega" />
      <main className={`${s.main} ${s.narrow}`}>
        <StepProgress step={3} title="Pagamento" />
        <h1 className={s.h1}>Como você quer pagar?</h1>

        <fieldset className={s.fieldset}>
          <legend className={s.legend}>Pagar agora</legend>
          {storefront.payments.payNow.map((p) => (
            <RadioCard key={p.method} name="pag" value={p.method} checked={paymentMethod === p.method} onChange={pick} title={p.label} detail={p.detail} />
          ))}
        </fieldset>
        <fieldset className={s.fieldset}>
          <legend className={s.legend}>Pagar ao receber</legend>
          {storefront.payments.payOnReceipt.map((p) => (
            <RadioCard key={p.method} name="pag" value={p.method} checked={paymentMethod === p.method} onChange={pick} title={p.label} detail={p.detail} />
          ))}
        </fieldset>

        <TextField
          label="Troco para quanto? (só para dinheiro)"
          inputMode="decimal"
          placeholder="Ex.: R$ 100,00"
          disabled={paymentMethod !== 'cash'}
          value={changeFor}
          onChange={(e) => setChangeFor(e.target.value)}
          error={tried ? change.error : undefined}
        />

        <div className={`${s.card} ${s.spread}`}>
          <span>Total</span>
          <span className={`${s.strong} ${s.tabular}`} style={{ fontSize: 18 }}>{formatBRL(totals.totalCents)}</span>
        </div>
      </main>
      <Footer>
        <Button size="lg" fullWidth onClick={next}>Revisar pedido</Button>
      </Footer>
    </>
  )
}
