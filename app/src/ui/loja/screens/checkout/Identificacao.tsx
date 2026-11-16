import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '@/components/Button'
import { TextField } from '@/components/Field'
import { formatPhone } from '@/domain/order'
import { TopBar } from '../../components/LojaShell'
import { StepProgress } from '../../components/Checkout'
import { useCheckout } from '../../state/checkout'
import l from '../../loja.module.css'

export function Identificacao() {
  const { draft, update } = useCheckout()
  const navigate = useNavigate()
  const [errors, setErrors] = useState<{ name?: string; phone?: string }>({})

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const next: typeof errors = {}
    if (draft.name.trim().length < 2) next.name = 'Informe seu nome para a casa saber de quem é o pedido.'
    const digits = draft.phone.replace(/\D/g, '')
    if (digits.length < 10) next.phone = 'Informe o celular com DDD, por exemplo (00) 90000-0000.'
    setErrors(next)
    if (Object.keys(next).length === 0) navigate('/checkout/entrega')
  }

  return (
    <form className={`${l.screen} ${l.narrow}`} onSubmit={submit} noValidate>
      <TopBar title="Finalizar pedido" back="/sacola" cart={false} />
      <main className={`${l.main} ${l.mainForm}`}>
        <StepProgress step={1} />
        <h1 className={l.h1}>Para quem é o pedido?</h1>
        <p className={l.muted}>Sem cadastro e sem senha. Usamos seus dados só para avisar sobre este pedido.</p>
        <TextField
          label="Nome"
          autoComplete="name"
          value={draft.name}
          error={errors.name}
          onChange={(e) => update({ name: e.target.value })}
        />
        <TextField
          label="Celular com WhatsApp"
          type="tel"
          inputMode="tel"
          autoComplete="tel-national"
          placeholder="(00) 90000-0000"
          value={draft.phone}
          error={errors.phone}
          help="Você recebe a confirmação e o código de entrega por aqui."
          onChange={(e) => update({ phone: formatPhone(e.target.value) })}
        />
        <div className={l.card} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <span className={l.muted}>Já tem conta na Bodeleve?</span>
          <Link to="/entrar" className={l.linkInline}>
            Entrar
          </Link>
        </div>
      </main>
      <div className={l.footer}>
        <Button type="submit" size="l" block>
          Continuar sem conta
        </Button>
      </div>
    </form>
  )
}
