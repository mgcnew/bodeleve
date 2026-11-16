// Pedidos da loja. Quem compra sem conta vê os pedidos feitos neste aparelho (H-L12):
// os ids ficam no localStorage. Hoje os pedidos também ficam lá; depois vão para `orders`.
import { hypotheses } from '@/config/hypotheses'
import type { Address, Fulfillment, Order, OrderItem, PaymentMethod } from '@/domain/order'
import { readJSON, writeJSON } from '@/lib/storage'
import { sampleOrders } from '@/mocks/orders'
import { products } from '@/mocks/catalog'
import { delay } from './delay'

const KEY = 'bodeleve.pedidos'

function deviceOrders(): Order[] {
  return readJSON<Order[]>(KEY, [])
}

export async function listDeviceOrders(): Promise<Order[]> {
  await delay()
  return [...deviceOrders(), ...sampleOrders].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

export async function getOrder(id: string): Promise<Order | null> {
  await delay()
  return [...deviceOrders(), ...sampleOrders].find((o) => o.id === id) ?? null
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
  const lastNumber = Math.max(1042, ...existing.map((o) => Number(o.number)))
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
