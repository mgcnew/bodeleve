import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { AppLink, Banner, Button } from '@/components'
import { paymentLabel, storefront } from '@/config/storefront'
import { addressLine, parseChangeFor, validateAddress, validateContact } from '@/domain/checkout'
import { formatBRL, lowerFirst } from '@/lib/format'
import { useServices } from '@/services'
import { useBag, useCheckout } from '@/store/bag'
import { useBagSummary } from '@/ui/loja/useBagSummary'
import { useStoreContent } from '@/ui/loja/queries'
import { Footer, ScreenHeader, StepProgress } from '@/ui/loja/parts'
import s from '@/ui/loja/loja.module.css'

function Block({ title, href, label, children }: { title: string; href: string; label: string; children: React.ReactNode }) {
  return (
    <section className={s.card} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div className={s.spread}>
        <h2 className={s.strong} style={{ fontSize: 16 }}>{title}</h2>
        <AppLink href={href} aria-label={label} className={s.link}>Alterar</AppLink>
      </div>
      <div className={s.sub}>{children}</div>
    </section>
  )
}

export function ReviewPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { orders } = useServices()
  const content = useStoreContent()
  const { lines, totals, fulfillment, isPending } = useBagSummary()
  const clearBag = useBag((b) => b.clear)
  const checkout = useCheckout()
  const [submitting, setSubmitting] = useState(false)
  const [failed, setFailed] = useState(false)

  const delivery = fulfillment === 'delivery'
  const contactOk = Object.keys(validateContact(checkout.contact)).length === 0
  const addressOk = !delivery || Object.keys(validateAddress(checkout.address)).length === 0
  const change = checkout.paymentMethod === 'cash' ? parseChangeFor(checkout.changeFor, totals.totalCents) : { cents: null as number | null, error: undefined }

  if (!isPending && lines.length === 0 && !submitting) return <Navigate to="/sacola" replace />
  if (!contactOk) return <Navigate to="/finalizar/identificacao" replace />
  if (!addressOk) return <Navigate to="/finalizar/entrega" replace />
  if (change.error) return <Navigate to="/finalizar/pagamento" replace />

  const windows = delivery ? storefront.deliveryWindows : storefront.pickupWindows
  const windowId = delivery ? checkout.deliveryWindowId : checkout.pickupWindowId
  const window = windows.find((w) => w.id === windowId) ?? windows[0]

  const confirm = async () => {
    setSubmitting(true)
    setFailed(false)
    try {
      const order = await orders.placeOrder({
        items: lines.map((l) => ({ productId: l.product.id, qty: l.qty })),
        fulfillment,
        contact: checkout.contact,
        address: delivery ? checkout.address : null,
        windowId: window.id,
        payment: { method: checkout.paymentMethod, changeForCents: change.cents },
      })
      clearBag()
      checkout.reset()
      await queryClient.invalidateQueries({ queryKey: ['orders'] })
      navigate(`/pedido-confirmado/${order.id}`, { replace: true })
    } catch {
      setFailed(true)
      setSubmitting(false)
    }
  }

  const paymentDetail =
    checkout.paymentMethod === 'pix'
      ? 'Pix · o código aparece ao confirmar'
      : checkout.paymentMethod === 'cash'
        ? `Dinheiro${change.cents ? ` · troco para ${formatBRL(change.cents)}` : ' · sem troco'}`
        : paymentLabel[checkout.paymentMethod]

  return (
    <>
      <ScreenHeader title="Finalizar pedido" back="/finalizar/pagamento" />
      <main className={`${s.main} ${s.narrow}`} style={{ gap: 12 }}>
        <StepProgress step={4} title="Revisão" />
        <h1 className={s.h1}>Confira antes de confirmar</h1>

        <section className={s.card} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div className={s.spread}>
            <h2 className={s.strong} style={{ fontSize: 16 }}>Itens</h2>
            <AppLink href="/sacola" aria-label="Alterar itens" className={s.link}>Alterar</AppLink>
          </div>
          {lines.map((l) => (
            <div key={l.product.id} className={`${s.spread} ${s.tabular}`} style={{ alignItems: 'flex-start' }}>
              <span>{l.qty} × {l.product.name}</span>
              <span>{formatBRL(l.totalCents)}</span>
            </div>
          ))}
        </section>

        <Block title={delivery ? 'Entrega' : 'Retirada'} href="/finalizar/entrega" label={delivery ? 'Alterar entrega' : 'Alterar retirada'}>
          {delivery ? `${addressLine(checkout.address)} — ${checkout.address.district}` : `Bodeleve · ${content.data?.address ?? ''}`}
          <br />
          {window.label} · {lowerFirst(window.detail)}
        </Block>
        <Block title="Pagamento" href="/finalizar/pagamento" label="Alterar pagamento">{paymentDetail}</Block>
        <Block title="Contato" href="/finalizar/identificacao" label="Alterar contato">{checkout.contact.name} · {checkout.contact.phone}</Block>

        <div className={`${s.card} ${s.cardLg}`} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div className={s.sumRow}><span>Subtotal</span><span>{formatBRL(totals.subtotalCents)}</span></div>
          <div className={s.sumRow}><span>Entrega</span><span>{delivery ? formatBRL(totals.deliveryFeeCents) : 'Grátis'}</span></div>
          <div className={`${s.sumRow} ${s.sumTotal}`}><span>Total</span><span>{formatBRL(totals.totalCents)}</span></div>
        </div>
        {failed && <Banner tone="error">Não foi possível confirmar o pedido. Nada foi cobrado. Tente de novo.</Banner>}
      </main>
      <Footer>
        <Button size="lg" fullWidth loading={submitting} onClick={confirm} style={{ justifyContent: 'space-between' }}>
          <span>{submitting ? 'Confirmando pedido…' : 'Confirmar pedido'}</span>
          {!submitting && <span className={s.tabular}>{formatBRL(totals.totalCents)}</span>}
        </Button>
      </Footer>
    </>
  )
}
