import type { ProductOrigin } from './catalog'
import type { Cents } from './money'

// Modelo da gestão (docs/DATA_MODEL_DRAFT.md). Saldo de estoque não é coluna: deriva de movimentações.

export type ItemType = 'resale' | 'raw_material' | 'finished'
export type StockUnit = 'un' | 'kg' | 'L'

export type Item = {
  id: string
  name: string
  unit: StockUnit
  itemType: ItemType
  /** só itens vendáveis têm origem (P-E) */
  origin: ProductOrigin | null
  categoryId: string
  minStock: number
  /** custo médio atual por unidade */
  costCents: Cents
  priceCents: Cents | null
  supplierId: string | null
  tracksLots: boolean
  soldByWeight: boolean
  published: boolean
  favoritePos: boolean
}

export type Lot = { id: string; itemId: string; code: string; expiry: string | null; unitCostCents: Cents; createdAt: string }

export type MovementType = 'purchase_in' | 'production_in' | 'production_out' | 'sale_out' | 'adjustment' | 'loss' | 'inventory'

export type Movement = {
  id: string
  itemId: string
  lotId: string | null
  type: MovementType
  /** positivo entra, negativo sai */
  qty: number
  at: string
  note: string
  by: string
  /** documento de origem: pedido, compra, ordem, recebimento */
  ref: string | null
}

export type Supplier = {
  id: string
  name: string
  categories: string
  contactName: string
  phone: string
  email: string
  document: string
  since: string
  paymentTerms: string
  paymentDays: number
  leadTime: string
}

export type PurchaseStatus = 'draft' | 'sent' | 'partially_received' | 'received' | 'cancelled'

export type PurchaseItem = { itemId: string; name: string; qty: number; unitCostCents: Cents; receivedQty: number }

export type Purchase = {
  id: string
  number: string
  supplierId: string
  status: PurchaseStatus
  sentAt: string | null
  expectedAt: string
  receivedAt: string | null
  paymentTerms: string
  items: PurchaseItem[]
}

export type EntryDirection = 'payable' | 'receivable'
export type FinancialEntry = {
  id: string
  direction: EntryDirection
  description: string
  counterpart: string
  categoryId: string
  amountCents: Cents
  dueDate: string
  paidAt: string | null
  paidAmountCents: Cents
  accountId: string | null
  /** compra, venda, manual, recorrente */
  origin: string
  ref: string | null
  recurring: boolean
}

export const unitLabel: Record<StockUnit, string> = { un: 'un', kg: 'kg', L: 'L' }

/** 6,4 kg · 12 un */
export function formatQty(qty: number, unit: StockUnit) {
  const n = Number.isInteger(qty) ? String(qty) : qty.toLocaleString('pt-BR', { maximumFractionDigits: 3 })
  return `${n} ${unitLabel[unit]}`
}

export function purchaseTotal(p: Purchase, field: 'qty' | 'receivedQty' = 'qty'): Cents {
  return p.items.reduce((n, i) => n + i[field] * i.unitCostCents, 0)
}
