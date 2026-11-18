import type { Cents } from './money'

export type PayMethod = 'cash' | 'pix' | 'debit' | 'credit' | 'on_account'

export const payLabels: Record<PayMethod, string> = { cash: 'Dinheiro', pix: 'Pix', debit: 'Débito', credit: 'Crédito', on_account: 'A prazo' }

/** Filtro do histórico agrupa débito e crédito em "Cartão" */
export const payGroup = (m: PayMethod): 'cash' | 'pix' | 'card' | 'term' => (m === 'debit' || m === 'credit' ? 'card' : m === 'on_account' ? 'term' : m)

export type SaleLine = {
  itemId: string
  name: string
  /** peso em gramas quando vendido por peso; senão null */
  grams: number | null
  quantity: number
  unitPriceCents: Cents
  totalCents: Cents
  lotCode: string | null
}

export type Payment = {
  method: PayMethod
  /** quanto desta forma entra na venda */
  cents: Cents
  /** dinheiro: o que o cliente entregou, para calcular o troco */
  receivedCents?: Cents
}

export type SaleEffects = { movementIds: string[]; ledgerIds: string[]; entryIds: string[] }

export type Sale = {
  id: string
  number: string
  at: string
  by: string
  lines: SaleLine[]
  subtotalCents: Cents
  discountCents: Cents
  discountLabel: string | null
  discountReason: string | null
  totalCents: Cents
  payments: Payment[]
  changeCents: Cents
  /** cliente da venda a prazo (quando houve) */
  customerName?: string | null
  status: 'done' | 'cancelled'
  cancelledAt: string | null
  cancelledBy: string | null
  effects: SaleEffects
  /** venda guardada no aparelho por falta de internet: ainda não chegou ao servidor (`failed`: o servidor recusou) */
  pending?: 'queued' | 'failed'
  pendingError?: string
}

export type CashMovement = { id: string; kind: 'withdrawal' | 'supply'; cents: Cents; reason: string; at: string }

export type CashSession = {
  id: string
  openedAt: string
  openedBy: string
  floatCents: Cents
  movements: CashMovement[]
  closedAt: string | null
  countedCents: Cents | null
  expectedCents: Cents | null
}

export type CartLine = { itemId: string; name: string; grams: number | null; quantity: number; unitPriceCents: Cents }

export type Discount = { label: string; cents: Cents; reason: string }

/** Cliente escolhido para a venda; `creditDays` preenchido libera a forma "A prazo" */
export type PosCustomer = { id: string; name: string; creditDays: number | null }

export type PosCart = { lines: CartLine[]; discount: Discount | null; customer?: PosCustomer | null }

/** Formas de pagamento da venda: "A prazo" só aparece quando o cliente escolhido tem prazo */
export const payMethodsFor = (c: PosCart): PayMethod[] => (c.customer?.creditDays ? ['cash', 'pix', 'debit', 'credit', 'on_account'] : ['cash', 'pix', 'debit', 'credit'])

export const lineTotal = (l: CartLine): Cents => Math.round(l.grams !== null ? (l.unitPriceCents * l.grams) / 1000 : l.unitPriceCents * l.quantity)

export const cartSubtotal = (c: PosCart): Cents => c.lines.reduce((n, l) => n + lineTotal(l), 0)

export const cartTotal = (c: PosCart): Cents => Math.max(0, cartSubtotal(c) - (c.discount?.cents ?? 0))

/** 0,500 kg ou 2 un */
export function qtyText(l: { grams: number | null; quantity: number }) {
  return l.grams !== null ? `${(l.grams / 1000).toLocaleString('pt-BR', { minimumFractionDigits: 3 })} kg` : `${l.quantity} un`
}
