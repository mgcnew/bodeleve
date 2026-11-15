import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AppLink, Button, TextField } from '@/components'
import { formatPhone, validateContact } from '@/domain/checkout'
import { useBag, useCheckout, useSession } from '@/store/bag'
import { Footer, ScreenHeader, StepProgress } from '@/ui/loja/parts'
import { Navigate } from 'react-router-dom'
import s from '@/ui/loja/loja.module.css'

export function IdentificationPage() {
  const navigate = useNavigate()
  const empty = useBag((b) => Object.keys(b.items).length === 0)
  const contact = useCheckout((c) => c.contact)
  const setContact = useCheckout((c) => c.setContact)
  const sessionPhone = useSession((x) => x.phone)
  const [tried, setTried] = useState(false)
  const phone = contact.phone || (sessionPhone ? formatPhone(sessionPhone) : '')
  const errors = tried ? validateContact({ name: contact.name, phone }) : {}

  if (empty) return <Navigate to="/sacola" replace />

  const next = () => {
    setTried(true)
    if (Object.keys(validateContact({ name: contact.name, phone })).length > 0) return
    if (!contact.phone) setContact({ phone })
    navigate('/finalizar/entrega')
  }

  return (
    <>
      <ScreenHeader title="Finalizar pedido" back="/sacola" />
      <main className={`${s.main} ${s.narrow}`}>
        <StepProgress step={1} title="Identificação" />
        <h1 className={s.h1}>Para quem é o pedido?</h1>
        <div className={s.sub}>Sem cadastro e sem senha. Usamos seus dados só para avisar sobre este pedido.</div>
        <TextField label="Nome" autoComplete="name" value={contact.name} onChange={(e) => setContact({ name: e.target.value })} error={errors.name} />
        <TextField
          label="Celular com WhatsApp"
          type="tel"
          inputMode="tel"
          autoComplete="tel-national"
          placeholder="(00) 90000-0000"
          value={phone}
          onChange={(e) => setContact({ phone: formatPhone(e.target.value) })}
          hint="Você recebe a confirmação e o código de entrega por aqui."
          error={errors.phone}
        />
        <div className={`${s.card} ${s.spread}`}>
          <span className={s.strong}>Já tem conta na Bodeleve?</span>
          <AppLink href="/entrar?next=/finalizar/identificacao" className={s.link}>Entrar</AppLink>
        </div>
      </main>
      <Footer>
        <Button size="lg" fullWidth onClick={next}>{sessionPhone ? 'Continuar' : 'Continuar sem conta'}</Button>
      </Footer>
    </>
  )
}
