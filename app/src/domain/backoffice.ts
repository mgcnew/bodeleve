import type { ProductOrigin } from './catalog'
import type { Cents } from './money'

// Modelo da gestão (docs/DATA_MODEL_DRAFT.md). Saldo de estoque não é coluna: deriva de movimentações.

export type ItemType = 'resale' | 'raw_material' | 'finished'
export type StockUnit = 'un' | 'kg' | 'L' | 'ml'

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
  /** texto da loja; marcador entre colchetes até o dono fornecer (P5) */
  description?: string
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

export const unitLabel: Record<StockUnit, string> = { un: 'un', kg: 'kg', L: 'L', ml: 'ml' }

/** 6,4 kg · 12 un */
export function formatQty(qty: number, unit: StockUnit) {
  const n = Number.isInteger(qty) ? String(qty) : qty.toLocaleString('pt-BR', { maximumFractionDigits: 3 })
  return `${n} ${unitLabel[unit]}`
}

export function purchaseTotal(p: Purchase, field: 'qty' | 'receivedQty' = 'qty'): Cents {
  return p.items.reduce((n, i) => n + i[field] * i.unitCostCents, 0)
}

// Produção (H-G15 a H-G19): ficha técnica por fornada e ordens para estoque ou para um pedido
export type Recipe = {
  id: string
  productId: string
  /** unidades boas esperadas por fornada */
  yieldQty: number
  batchLabel: string
  shelfLifeDays: number
  lines: { itemId: string; qty: number }[]
  /** H-G19 — gás e energia como custo indireto estimado por fornada */
  indirectCostCents: Cents
  prepNotes: string
}

export type ProductionStatus = 'planned' | 'in_progress' | 'done' | 'cancelled'

export type ProductionOrder = {
  id: string
  number: string
  recipeId: string
  productId: string
  batches: number
  plannedQty: number
  destination: { kind: 'stock' } | { kind: 'order'; orderNumber: string }
  status: ProductionStatus
  startAt: string
  endAt: string
  goodQty: number | null
  lotCode: string | null
  /** consumo real por insumo, na conclusão */
  consumptions: { itemId: string; qty: number }[] | null
  realUnitCostCents: Cents | null
}

// Financeiro (H-G20 a H-G24): duas contas de dinheiro; transferência entre elas não é entrada nem saída
export type Account = { id: string; name: string; openingCents: Cents }

export type LedgerKind = 'in' | 'out' | 'transfer'

export type LedgerTx = {
  id: string
  at: string
  title: string
  sub: string
  accountId: string
  /** positivo entra na conta, negativo sai */
  amountCents: Cents
  kind: LedgerKind
  entryId: string | null
}

// Pessoas e casa
export type Customer = {
  id: string
  name: string
  phone: string
  address: string
  since: string
  channel: string
  orderCount: number
  totalCents: Cents
  fiadoCents: Cents
  lastOrderLabel: string
  topItems: { name: string; times: number }[]
  history: { number: string; date: string; line: string; totalCents: Cents; status: string }[]
  notes: string
}

export type Courier = { id: string; name: string; kind: 'own' | 'partner'; status: 'available' | 'en_route' | 'online'; note: string }

export type TeamMember = { id: string; name: string; role: import('@/permissions/roles').Role; detail: string; pending?: boolean }
