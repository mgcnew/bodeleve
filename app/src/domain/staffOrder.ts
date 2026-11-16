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
  distanceKm?: number
  /** H-E5 — código de 4 números que a cliente informa ao entregador */
  deliveryCode: string
  courierStage?: 'accepted' | 'collected'
  /** ids dos produtos no banco, na mesma ordem de `items` (só com o Supabase ligado) */
  itemIds?: string[]
  /** entrega reservada ou publicada, ainda sem entregador em rota */
  deliveryNote?: string
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
