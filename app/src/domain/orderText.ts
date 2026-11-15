import type { Order } from './types'

/** "Pix · pago", "Pagar na retirada"… como a Gestão lê o pagamento do pedido. */
export function paymentSummary(o: Pick<Order, 'payment' | 'fulfillment'>): string {
  const { method, paid } = o.payment
  if (method === 'pix') return paid ? 'Pix · pago' : 'Pix · aguardando pagamento'
  if (paid) return method === 'cash' ? 'Dinheiro · pago' : 'Cartão · pago'
  return o.fulfillment === 'pickup' ? 'Pagar na retirada' : 'Pagar na entrega'
}

/** Etiqueta do bloco de total na tela do pedido. */
export function paymentBadge(o: Pick<Order, 'payment' | 'fulfillment'>): { label: string; tone: 'success' | 'warning' | 'neutral' } {
  const { method, paid } = o.payment
  if (method === 'pix') return paid ? { label: 'Pago · Pix', tone: 'success' } : { label: 'Aguardando pagamento · Pix', tone: 'warning' }
  if (paid) return { label: method === 'cash' ? 'Pago · dinheiro' : 'Pago · cartão', tone: 'success' }
  return { label: o.fulfillment === 'pickup' ? 'Pagar na retirada' : 'Pagar na entrega', tone: 'neutral' }
}
