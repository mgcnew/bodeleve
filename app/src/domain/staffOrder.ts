import type { Cents } from './money'

// H-G4 — pedido online: Novo → Separando (conferência item a item, com lote) → Pronto → Em rota
export type StaffOrderStatus = 'new' | 'separating' | 'ready' | 'en_route' | 'delivered'

export type StaffOrderItem = {
  productId: string
  name: string
  /** "1 un · 500 g" */
  qtyLabel: string
  quantity: number
  unitPriceCents: Cents
  lot: string | null
  lotExpiry: string | null
}

export type StaffOrder = {
  id: string
  number: string
  createdAt: string
  status: StaffOrderStatus
  customer: { id: string; name: string; phone: string; since: string; orderCount: number }
  fulfillment: 'delivery' | 'pickup'
  address: { line1: string; line2: string } | null
  windowLabel: string
  items: StaffOrderItem[]
  /** conferência na separação, na ordem dos itens */
  checked: boolean[]
  feeCents: Cents
  paymentLabel: string
  paid: boolean
  courierName: string | null
}

export const staffStatusLabels: Record<StaffOrderStatus, string> = {
  new: 'Novo',
  separating: 'Separando',
  ready: 'Pronto',
  en_route: 'Em rota',
  delivered: 'Entregue',
}

export function staffSubtotal(o: StaffOrder): Cents {
  return o.items.reduce((n, i) => n + i.quantity * i.unitPriceCents, 0)
}

export function staffTotal(o: StaffOrder): Cents {
  return staffSubtotal(o) + o.feeCents
}
