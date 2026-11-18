import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/Button'
import { Panel, SummaryRow, SummaryTotal } from '@/components/Card'
import { Banner } from '@/components/Feedback'
import { RadioGroup, TextAreaField, TextField } from '@/components/Field'
import { formatCents } from '@/domain/money'
import { formatPhone } from '@/domain/order'
import { orderMessage, saveWhatsappText } from '@/lib/whatsappOrder'
import { createOrder } from '@/services/orders'
import { orderErrorMessage } from '@/services/ordersRemote'
import { hasWhatsapp, whatsappLink } from '@/services/gestao/purchases'
import { TopBar } from '../../components/LojaShell'
import { Place } from '../../components/Checkout'
import { useCart } from '../../state/cart'
import { useCheckout } from '../../state/checkout'
import { useEstablishment } from '../../state/storeInfo'
import l from '../../loja.module.css'

// D19 — fase sem entrega: o pedido é salvo e a mensagem vai pronta para o WhatsApp da casa
export function EnviarWhatsapp() {
  const { lines, subtotalCents } = useCart()
  const { draft, update, windowsFor, windowLabel, windowId } = useCheckout()
  const establishment = useEstablishment()
  const navigate = useNavigate()
  const [note, setNote] = useState('')
  const [errors, setErrors] = useState<{ name?: string; phone?: string }>({})
  const [sending, setSending] = useState(false)
  const [failMessage, setFailMessage] = useState<string>()
  const configured = hasWhatsapp(establishment.whatsapp)
  const windows = windowsFor('pickup')

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (sending || !configured) return
    const next: typeof errors = {}
    if (draft.name.trim().length < 2) next.name = 'Informe seu nome para a casa saber de quem é o pedido.'
    if (draft.phone.replace(/\D/g, '').length < 10) next.phone = 'Informe o celular com DDD, por exemplo (00) 90000-0000.'
    setErrors(next)
    if (next.name || next.phone) return
    setSending(true)
    setFailMessage(undefined)
    // abre a aba agora, no toque, para o navegador não bloquear; o endereço do WhatsApp entra quando o pedido estiver salvo
    const tab = window.open('about:blank', '_blank')
    try {
      const order = await createOrder(
        {
          contact: { name: draft.name.trim(), phone: draft.phone },
          fulfillment: 'pickup',
          address: null,
          windowLabel,
          payment: 'on_pickup',
          changeForCents: null,
          items: lines.map((li) => ({ productId: li.productId, name: li.name, quantity: li.quantity, unitPriceCents: li.unitPriceCents })),
          feeCents: 0,
        },
        windowId,
      )
      const text = orderMessage(order, note, establishment.name)
      saveWhatsappText(order.id, text)
      if (tab) tab.location.href = whatsappLink(establishment.whatsapp, text)
      // a sacola é esvaziada na confirmação; esvaziar aqui faria o guarda voltar para a sacola
      navigate(`/pedidos/${order.id}/confirmado`, { replace: true, state: { placed: true } })
    } catch (err) {
      tab?.close()
      setFailMessage(orderErrorMessage(err))
      setSending(false)
    }
  }

  return (
    <form className={`${l.screen} ${l.narrow}`} onSubmit={(e) => void submit(e)} noValidate>
      <TopBar title="Enviar pedido" back="/sacola" cart={false} />
      <main className={`${l.main} ${l.mainForm}`}>
        <h1 className={l.h1}>Enviar pedido pelo WhatsApp</h1>
        <p className={l.muted}>Você manda o pedido por escrito para a {establishment.name} e a casa confirma por lá. Nada é cobrado agora: o pagamento é na retirada.</p>

        <TextField label="Nome" autoComplete="name" value={draft.name} error={errors.name} onChange={(e) => update({ name: e.target.value })} />
        <TextField
          label="Celular com WhatsApp"
          type="tel"
          inputMode="tel"
          autoComplete="tel-national"
          placeholder="(00) 90000-0000"
          value={draft.phone}
          error={errors.phone}
          onChange={(e) => update({ phone: formatPhone(e.target.value) })}
        />

        <Place>
          <div style={{ fontWeight: 600 }}>Retirada na loja · {establishment.name}</div>
          <div className={l.muted}>
            {establishment.address}
            <br />
            {establishment.hours}
          </div>
        </Place>
        <RadioGroup legend="Quando você pode retirar?" name="quando" value={windowId} onChange={(id) => update({ windowId: id })} options={windows.map((w) => ({ value: w.id, title: w.title, sub: w.sub }))} />

        <TextAreaField
          label="Observação (opcional)"
          value={note}
          maxLength={300}
          placeholder="Precisa de entrega? Escreva aqui e combinamos pelo WhatsApp."
          onChange={(e) => setNote(e.target.value)}
        />

        <Panel title="Seu pedido">
          {lines.map((li) => (
            <SummaryRow key={li.productId} label={`${li.quantity} × ${li.name}`} value={formatCents(li.quantity * li.unitPriceCents)} />
          ))}
          <SummaryTotal value={formatCents(subtotalCents)} />
        </Panel>

        {!configured && <Banner tone="warning">O atendimento por WhatsApp da loja ainda não foi configurado. Volte mais tarde.</Banner>}
        {failMessage && <Banner tone="error">{failMessage}</Banner>}
      </main>
      <div className={l.footer}>
        {sending ? (
          <Button size="l" block loading>
            Salvando pedido…
          </Button>
        ) : (
          <Button type="submit" size="l" block spread disabled={!configured}>
            <span>Enviar pelo WhatsApp</span>
            <span className={l.num}>{formatCents(subtotalCents)}</span>
          </Button>
        )}
      </div>
    </form>
  )
}
