// Pedidos da loja. Quem compra sem conta vê os pedidos feitos neste aparelho (H-L12):
// os ids ficam no localStorage. Hoje os pedidos também ficam lá; depois vão para `orders`.
import { hypotheses } from '@/config/hypotheses'
import type { Address, Fulfillment, Order, OrderItem, PaymentMethod } from '@/domain/order'
import { readJSON, writeJSON } from '@/lib/storage'
import { sampleOrders } from '@/mocks/orders'
import { products } from '@/mocks/catalog'
import { delay } from './delay'
import { staffOrdersStore } from './gestao/orders'
import type { StaffOrder, StaffOrderStatus } from '@/domain/staffOrder'
import type { OrderStatus } from '@/domain/order'

const KEY = 'bodeleve.pedidos'

function deviceOrders(): Order[] {
  return readJSON<Order[]>(KEY, [])
}

const staffId = (orderId: string) => `s-${orderId}`

/** O pedido do aparelho acompanha o andamento que a gestão e o entregador registram */
function withStaffProgress(o: Order): Order {
  const staff = staffOrdersStore.get().find((x) => x.id === staffId(o.id))
  if (!staff) return o
  const delivery = o.fulfillment === 'delivery'
  const map: Record<StaffOrderStatus, OrderStatus> = {
    new: 'received',
    separating: 'preparing',
    ready: delivery ? 'preparing' : 'ready_for_pickup',
    en_route: 'out_for_delivery',
    delivered: delivery ? 'delivered' : 'picked_up',
  }
  const now = new Date().toISOString()
  const reached: OrderStatus[] = ['received', 'preparing', 'out_for_delivery', 'ready_for_pickup', 'delivered', 'picked_up']
  const status = map[staff.status]
  const times = { ...o.statusTimes }
  for (const st of reached.slice(0, reached.indexOf(status) + 1)) if (!times[st]) times[st] = now
  return { ...o, status, statusTimes: times, courierNote: staff.courierName ? `com ${staff.courierName}` : null }
}

export async function listDeviceOrders(): Promise<Order[]> {
  await delay()
  return [...deviceOrders().map(withStaffProgress), ...sampleOrders].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

export async function getOrder(id: string): Promise<Order | null> {
  await delay()
  const found = [...deviceOrders(), ...sampleOrders].find((o) => o.id === id)
  return found && deviceOrders().some((d) => d.id === id) ? withStaffProgress(found) : (found ?? null)
}

export type NewOrder = {
  contact: { name: string; phone: string }
  fulfillment: Fulfillment
  address: Address | null
  windowLabel: string
  payment: PaymentMethod
  changeForCents: number | null
  items: OrderItem[]
  feeCents: number
}

function randomCode(length: number) {
  return Array.from({ length }, () => Math.floor(Math.random() * 10)).join('')
}

export async function createOrder(input: NewOrder): Promise<Order> {
  await delay(600)
  const existing = deviceOrders()
  // a numeração é única entre a loja e a fila da gestão
  const lastNumber = Math.max(1042, ...existing.map((o) => Number(o.number)), ...staffOrdersStore.get().map((o) => Number(o.number)))
  const now = new Date()
  const order: Order = {
    ...input,
    id: crypto.randomUUID(),
    number: String(lastNumber + 1),
    createdAt: now.toISOString(),
    status: 'received',
    statusTimes: { received: now.toISOString() },
    estimatedAt: input.fulfillment === 'delivery' ? new Date(now.getTime() + 50 * 60_000).toISOString() : null,
    courierNote: null,
    deliveryCode: randomCode(hypotheses.deliveryCodeLength),
  }
  writeJSON(KEY, [order, ...existing])
  // chega à fila de pedidos da gestão; com o Supabase isso vira um único registro em `orders` (Realtime)
  const staff: StaffOrder = {
    id: staffId(order.id),
    number: order.number,
    createdAt: order.createdAt,
    status: 'new',
    customer: { id: order.contact.phone.replace(/\D/g, '') || order.id, name: order.contact.name, phone: order.contact.phone, since: order.createdAt, orderCount: existing.length + 1 },
    fulfillment: order.fulfillment,
    address: order.address ? { line1: `${order.address.street}, ${order.address.number}${order.address.complement ? ` · ${order.address.complement}` : ''}`, line2: order.address.district } : null,
    windowLabel: order.windowLabel,
    items: order.items.map((i) => ({ productId: i.productId, name: i.name, qtyLabel: `${i.quantity} un`, quantity: i.quantity, unitPriceCents: i.unitPriceCents, lot: null, lotExpiry: null })),
    checked: order.items.map(() => false),
    feeCents: order.feeCents,
    paymentLabel: input.payment === 'pix' ? 'Pix' : input.payment === 'cash' ? 'Dinheiro na entrega' : 'Cartão na entrega',
    // Pix é pago pelo cliente fora do balcão; cartão e dinheiro são cobrados na entrega ou retirada
    paid: input.payment === 'pix',
    courierName: null,
    deliveryCode: order.deliveryCode,
  }
  staffOrdersStore.set((all) => [staff, ...all])
  return order
}

/** Itens do pedido que ainda estão à venda hoje (H-L13) */
export function availableForReorder(order: Order) {
  return order.items.map((item) => ({
    item,
    product: products.find((p) => p.id === item.productId && p.available) ?? null,
  }))
}

/**
 * H-L9 — endereço validado contra a área de entrega pelo CEP (Q6).
 * Sem área definida pelo dono, todo CEP completo é aceito com a taxa fixa.
 */
export async function checkDeliveryArea(cep: string): Promise<{ ok: boolean; feeCents: number }> {
  await delay(300)
  return { ok: cep.replace(/\D/g, '').length === 8, feeCents: hypotheses.deliveryFee }
}
