import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/Button'
import { RadioGroup, TextField } from '@/components/Field'
import { formatCents } from '@/domain/money'
import type { PaymentMethod } from '@/domain/order'
import { TopBar } from '../../components/LojaShell'
import { StepProgress } from '../../components/Checkout'
import { useCart } from '../../state/cart'
import { useCheckout } from '../../state/checkout'
import l from '../../loja.module.css'

/** "R$ 100,00" ou "100" → centavos; null se vazio ou inválido */
export function parseCents(text: string): number | null {
  const clean = text.replace(/[^\d,.]/g, '').replace(/\./g, '').replace(',', '.')
  if (!clean) return null
  const value = Number(clean)
  return Number.isFinite(value) ? Math.round(value * 100) : null
}

export function Pagamento() {
  const { draft, update, feeCents } = useCheckout()
  const { subtotalCents } = useCart()
  const navigate = useNavigate()
  const [error, setError] = useState<string>()
  const total = subtotalCents + feeCents
  const onReceive = draft.fulfillment === 'delivery' ? 'na entrega' : 'na retirada'

  const choose = (payment: PaymentMethod) => {
    setError(undefined)
    update({ payment })
  }

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (draft.payment === 'cash' && draft.changeFor.trim()) {
      const change = parseCents(draft.changeFor)
      if (change === null || change < total) {
        setError(`Informe um valor maior que o total de ${formatCents(total)}, ou deixe em branco se não precisa de troco.`)
        return
      }
    }
    navigate('/checkout/revisao')
  }

  return (
    <form className={`${l.screen} ${l.narrow}`} onSubmit={submit} noValidate>
      <TopBar title="Finalizar pedido" back="/checkout/entrega" cart={false} />
      <main className={`${l.main} ${l.mainForm}`}>
        <StepProgress step={3} />
        <h1 className={l.h1}>Como você quer pagar?</h1>
        {/* H-L8 — Pix agora; cartão ou dinheiro ao receber; sem cartão online */}
        <RadioGroup
          legend="Pagar agora"
          name="pag"
          value={draft.payment}
          onChange={choose}
          options={[{ value: 'pix', title: 'Pix', sub: 'O código aparece ao confirmar o pedido' }]}
        />
        <RadioGroup
          legend={draft.fulfillment === 'delivery' ? 'Pagar ao receber' : 'Pagar na retirada'}
          name="pag"
          value={draft.payment}
          onChange={choose}
          options={[
            { value: 'card_on_delivery', title: `Cartão ${onReceive}`, sub: 'Débito ou crédito, na maquininha' },
            { value: 'cash', title: 'Dinheiro', sub: 'Informe abaixo se precisa de troco' },
          ]}
        />
        <TextField
          label="Troco para quanto? (só para dinheiro)"
          inputMode="decimal"
          placeholder="Ex.: R$ 100,00"
          value={draft.changeFor}
          disabled={draft.payment !== 'cash'}
          error={error}
          onChange={(e) => update({ changeFor: e.target.value })}
        />
        <div className={l.card} style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600, fontSize: 18 }}>
          <span>Total</span>
          <span className={l.num}>{formatCents(total)}</span>
        </div>
      </main>
      <div className={l.footer}>
        <Button type="submit" size="l" block>
          Revisar pedido
        </Button>
      </div>
    </form>
  )
}
