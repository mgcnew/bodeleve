import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/Button'
import { Panel, SummaryRow, SummaryTotal } from '@/components/Card'
import { Banner } from '@/components/Feedback'
import { formatCents } from '@/domain/money'
import { formatAddress, paymentLabels } from '@/domain/order'
import { establishment } from '@/mocks/establishment'
import { createOrder } from '@/services/orders'
import { TopBar } from '../../components/LojaShell'
import { ReviewBlock, StepProgress } from '../../components/Checkout'
import { useCart } from '../../state/cart'
import { useCheckout } from '../../state/checkout'
import { parseCents } from './Pagamento'
import l from '../../loja.module.css'

export function Revisao() {
  const { lines, subtotalCents } = useCart()
  const { draft, feeCents, windowLabel } = useCheckout()
  const navigate = useNavigate()
  const [sending, setSending] = useState(false)
  const [failed, setFailed] = useState(false)
  const total = subtotalCents + feeCents
  const delivery = draft.fulfillment === 'delivery'
  const addr = draft.address && formatAddress(draft.address)
  const change = draft.payment === 'cash' ? parseCents(draft.changeFor) : null

  const paymentText =
    draft.payment === 'pix'
      ? 'Pix · o código aparece ao confirmar'
      : draft.payment === 'cash'
        ? `Dinheiro · ${change ? `troco para ${formatCents(change)}` : 'sem troco'}`
        : `${paymentLabels.card_on_delivery} · débito ou crédito`

  const confirm = async () => {
    if (sending) return
    setSending(true)
    setFailed(false)
    try {
      const order = await createOrder({
        contact: { name: draft.name.trim(), phone: draft.phone },
        fulfillment: draft.fulfillment,
        address: delivery ? draft.address : null,
        windowLabel,
        payment: draft.payment,
        changeForCents: change,
        items: lines.map((li) => ({
          productId: li.productId,
          name: li.name,
          quantity: li.quantity,
          unitPriceCents: li.unitPriceCents,
        })),
        feeCents,
      })
      // a sacola é esvaziada na confirmação; esvaziar aqui faria o guarda voltar para a sacola
      navigate(`/pedidos/${order.id}/confirmado`, { replace: true, state: { placed: true } })
    } catch {
      setFailed(true)
      setSending(false)
    }
  }

  return (
    <div className={`${l.screen} ${l.narrow}`}>
      <TopBar title="Finalizar pedido" back="/checkout/pagamento" cart={false} />
      <main className={`${l.main} ${l.mainCompact}`}>
        <StepProgress step={4} />
        <h1 className={l.h1}>Confira antes de confirmar</h1>
        <ReviewBlock title="Itens" to="/sacola">
          {lines.map((li) => (
            <SummaryRow key={li.productId} label={`${li.quantity} × ${li.name}`} value={formatCents(li.quantity * li.unitPriceCents)} />
          ))}
        </ReviewBlock>
        <ReviewBlock title={delivery ? 'Entrega' : 'Retirada'} to="/checkout/entrega">
          <div className={l.secondary}>
            {delivery && addr ? `${addr.line1} — ${addr.line2}` : `${establishment.name} · ${establishment.address}`}
            <br />
            {windowLabel}
          </div>
        </ReviewBlock>
        <ReviewBlock title="Pagamento" to="/checkout/pagamento">
          <div className={l.secondary}>{paymentText}</div>
        </ReviewBlock>
        <ReviewBlock title="Contato" to="/checkout/identificacao">
          <div className={`${l.secondary} ${l.num}`}>
            {draft.name} · {draft.phone}
          </div>
        </ReviewBlock>
        <Panel>
          <SummaryRow label="Subtotal" value={formatCents(subtotalCents)} />
          <SummaryRow label={delivery ? 'Entrega' : 'Retirada na loja'} value={feeCents ? formatCents(feeCents) : 'Grátis'} />
          <SummaryTotal value={formatCents(total)} />
        </Panel>
        {failed && <Banner tone="error">Não foi possível enviar o pedido. Nada foi cobrado. Tente de novo.</Banner>}
      </main>
      <div className={l.footer}>
        {sending ? (
          <Button size="l" block loading>
            Confirmando pedido…
          </Button>
        ) : (
          <Button size="l" block spread onClick={confirm}>
            <span>Confirmar pedido</span>
            <span className={l.num}>{formatCents(total)}</span>
          </Button>
        )}
      </div>
    </div>
  )
}
