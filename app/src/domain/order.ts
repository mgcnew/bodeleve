import type { Cents } from './money'

export type Fulfillment = 'delivery' | 'pickup'
export type PaymentMethod = 'pix' | 'card_on_delivery' | 'cash' | 'on_pickup' | 'on_account'

export type OrderStatus =
  | 'received'
  | 'preparing'
  | 'out_for_delivery'
  | 'ready_for_pickup'
  | 'delivered'
  | 'picked_up'
  | 'cancelled'

export type Address = {
  cep: string
  street: string
  number: string
  complement: string
  district: string
  reference: string
}

export type OrderItem = { productId: string; name: string; quantity: number; unitPriceCents: Cents }

export type Order = {
  id: string
  number: string
  createdAt: string
  status: OrderStatus
  /** horários de cada etapa já cumprida */
  statusTimes: Partial<Record<OrderStatus, string>>
  fulfillment: Fulfillment
  address: Address | null
  windowLabel: string
  estimatedAt: string | null
  /** texto de previsão vindo do banco, quando não há horário exato */
  etaLabel?: string | null
  courierNote: string | null
  payment: PaymentMethod
  changeForCents: Cents | null
  contact: { name: string; phone: string }
  items: OrderItem[]
  feeCents: Cents
  deliveryCode: string
}

export function subtotal(items: { quantity: number; unitPriceCents: Cents }[]): Cents {
  return items.reduce((sum, i) => sum + i.quantity * i.unitPriceCents, 0)
}

export function orderTotal(order: Order): Cents {
  return subtotal(order.items) + order.feeCents
}

export function itemCount(items: { quantity: number }[]) {
  return items.reduce((sum, i) => sum + i.quantity, 0)
}

export function isFinished(status: OrderStatus) {
  return status === 'delivered' || status === 'picked_up' || status === 'cancelled'
}

export const paymentLabels: Record<PaymentMethod, string> = {
  pix: 'Pix',
  card_on_delivery: 'Cartão na entrega',
  cash: 'Dinheiro',
  on_pickup: 'Pagar na retirada',
  on_account: 'A prazo',
}

export function formatAddress(a: Address) {
  const line1 = [`${a.street}, ${a.number}`, a.complement].filter(Boolean).join(' · ')
  return { line1, line2: a.district }
}

/** Celular no formato (00) 90000-0000 */
export function formatPhone(raw: string) {
  const d = raw.replace(/\D/g, '').slice(0, 11)
  if (d.length <= 2) return d
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`
}

export function formatCep(raw: string) {
  const d = raw.replace(/\D/g, '').slice(0, 8)
  return d.length > 5 ? `${d.slice(0, 5)}-${d.slice(5)}` : d
}

export function formatTime(iso: string) {
  const d = new Date(iso)
  return `${d.getHours()}h${String(d.getMinutes()).padStart(2, '0')}`
}

export function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
}

export function isToday(iso: string) {
  return new Date(iso).toDateString() === new Date().toDateString()
}
