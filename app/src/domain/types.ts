import type { Origin } from '@/components'

/** Tipos do domínio da loja. Dinheiro sempre em centavos (inteiro). */

export type Product = {
  id: string
  name: string
  /** Embalagem ou medida de venda: "500 g", "1 kg", "200 ml". */
  unit: string
  priceCents: number
  origin: Origin
  categoryId: string
  available: boolean
  /** Conteúdo do dono (P5). Enquanto não houver, vêm os marcadores entre colchetes. */
  details: { description: string; conservation: string; validity: string; ingredients: string }
}

export type Category = { id: string; name: string }

/** Seção da página inicial (H-L3): é configuração, não código. */
export type HomeSection = { id: string; title: string; subtitle: string; productIds: string[] }

export type Fulfillment = 'delivery' | 'pickup'
export type PaymentMethod = 'pix' | 'card_on_delivery' | 'cash'

export type TimeWindow = { id: string; label: string; detail: string }

export type Address = {
  cep: string
  street: string
  number: string
  complement: string
  district: string
  reference: string
}

export type Contact = { name: string; phone: string }

export type OrderStatus = 'received' | 'preparing' | 'out_for_delivery' | 'delivered' | 'ready_for_pickup' | 'picked_up' | 'cancelled'

export type OrderItem = {
  productId: string
  name: string
  unit: string
  unitPriceCents: number
  qty: number
}

export type Order = {
  /** Número exibido ao cliente: "1042". */
  id: string
  createdAt: string
  status: OrderStatus
  fulfillment: Fulfillment
  items: OrderItem[]
  subtotalCents: number
  deliveryFeeCents: number
  totalCents: number
  contact: Contact
  address: Address | null
  window: TimeWindow
  payment: { method: PaymentMethod; changeForCents: number | null }
  /** Código que o cliente informa ao entregador (H6, H-L4). */
  deliveryCode: string
  /** "Hoje, 15h40" */
  etaLabel: string | null
  courierName: string | null
  /** Horário de cada etapa já alcançada, em "14h52". */
  stepTimes: Partial<Record<OrderStatus, string>>
}

export type PlaceOrderInput = {
  items: Array<{ productId: string; qty: number }>
  fulfillment: Fulfillment
  contact: Contact
  address: Address | null
  windowId: string
  payment: { method: PaymentMethod; changeForCents: number | null }
}

export type AreaCheck =
  | { covered: true; feeCents: number; street: string; district: string }
  | { covered: false }

/** Textos que o dono ainda vai fornecer (P4). Mantidos como conteúdo editável, nunca fixos nas telas. */
export type StoreContent = {
  homeText: string
  aboutHistory: string
  address: string
  hours: string
  whatsapp: string
  brandText: string
  brandUpcoming: string
  brandWhere: string
  brandCommitment: string
}
