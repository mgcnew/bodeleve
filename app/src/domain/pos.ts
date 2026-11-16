import { lotsFefo, type Lot, type StockMovement } from './inventory'
import { kgToUnits } from './units'

/**
 * Venda de balcão (PDV). Dinheiro em centavos; peso em kg (3 casas). Regras puras: o estoque e o financeiro são lançados pelo serviço
 * com estas funções, e cada venda guarda o que foi vendido, a que preço, por qual lote e como foi paga.
 */

export type PayMethod = 'cash' | 'pix' | 'debit' | 'credit'
export const payLabel: Record<PayMethod, string> = { cash: 'Dinheiro', pix: 'Pix', debit: 'Débito', credit: 'Crédito' }
export const payMethods: PayMethod[] = ['cash', 'pix', 'debit', 'credit']
/** Nos relatórios, débito e crédito somam como "Cartão". */
export const isCard = (m: PayMethod) => m === 'debit' || m === 'credit'

export class PosError extends Error {
  constructor(
    public code: 'empty_cart' | 'insufficient_stock' | 'invalid_payment' | 'unknown_product' | 'session_closed' | 'not_found' | 'already_cancelled' | 'invalid_pin' | 'invalid_amount' | 'invalid_qty' | 'no_session',
    public detail?: string,
  ) {
    super(code)
  }
}

/** Linha da sacola: unidades inteiras ou peso em kg. */
export type CartLine = { key: string; itemId: string; kind: 'unit' | 'weight'; qty: number }

export type PriceInfo = { name: string; unit: string; priceCents: number; weightPriceCents: number | null }

export type SaleLine = {
  itemId: string
  name: string
  kind: 'unit' | 'weight'
  qty: number
  /** Preço da unidade (embalagem) ou do kg, conforme o tipo da linha. */
  unitPriceCents: number
  totalCents: number
  /** Unidades de estoque que saem (peso convertido pela embalagem). */
  stockUnits: number
  /** Lotes de onde saiu, na ordem que vence primeiro. */
  lots: Array<{ lotCode: string; qty: number }>
}

export const lineTotal = (kind: 'unit' | 'weight', qty: number, priceCents: number) => (kind === 'unit' ? Math.round(qty * priceCents) : Math.round(priceCents * qty))

/** Preço a partir do catálogo. Peso pede preço por kg cadastrado. */
export function priceLine(line: CartLine, info: PriceInfo | undefined): SaleLine {
  if (!info) throw new PosError('unknown_product')
  if (!(line.qty > 0)) throw new PosError('invalid_qty')
  if (line.kind === 'unit') {
    if (!Number.isInteger(line.qty)) throw new PosError('invalid_qty')
    return { itemId: line.itemId, name: info.name, kind: 'unit', qty: line.qty, unitPriceCents: info.priceCents, totalCents: lineTotal('unit', line.qty, info.priceCents), stockUnits: line.qty, lots: [] }
  }
  if (info.weightPriceCents == null) throw new PosError('unknown_product', 'Produto sem preço por kg')
  return { itemId: line.itemId, name: info.name, kind: 'weight', qty: line.qty, unitPriceCents: info.weightPriceCents, totalCents: lineTotal('weight', line.qty, info.weightPriceCents), stockUnits: kgToUnits(line.qty, info.unit), lots: [] }
}

export type DiscountKind = 'p5' | 'p10' | 'f500' | 'round'
export const discountKinds: Array<{ kind: DiscountKind; label: string }> = [
  { kind: 'p5', label: '5%' },
  { kind: 'p10', label: '10%' },
  { kind: 'f500', label: 'R$ 5,00' },
  { kind: 'round', label: 'Arredondar' },
]
export const discountLabel: Record<DiscountKind, string> = { p5: 'Desconto 5%', p10: 'Desconto 10%', f500: 'Desconto', round: 'Arredondamento' }
export const discountReasons = ['Cliente da casa', 'Produto perto da validade', 'Arredondamento', 'Outro']

export type Discount = { kind: DiscountKind; cents: number; reason: string }

/** Valor do desconto sobre o subtotal. Nunca passa do subtotal. "Arredondar" tira os centavos. */
export function discountCents(kind: DiscountKind, subtotalCents: number): number {
  const v = kind === 'p5' ? Math.round(subtotalCents * 0.05) : kind === 'p10' ? Math.round(subtotalCents * 0.1) : kind === 'f500' ? 500 : subtotalCents % 100
  return Math.min(v, subtotalCents)
}

export const subtotalOf = (lines: Array<Pick<SaleLine, 'totalCents'>>) => lines.reduce((a, l) => a + l.totalCents, 0)
export const totalOf = (lines: Array<Pick<SaleLine, 'totalCents'>>, discount: Pick<Discount, 'cents'> | null) => subtotalOf(lines) - (discount?.cents ?? 0)

/** "Dar desconto" recalcula sobre o subtotal de agora (a sacola pode ter mudado depois de escolher). */
export const withDiscount = (kind: DiscountKind, reason: string, subtotalCents: number): Discount | null => {
  const cents = discountCents(kind, subtotalCents)
  return cents > 0 ? { kind, cents, reason } : null
}

export type Payment = { method: PayMethod; cents: number; /** Só dinheiro: quanto o cliente entregou. */ receivedCents?: number }

/** Atalhos de dinheiro entregue: "Exato", a próxima dezena, mais dez e o próximo múltiplo de 50. */
export function cashSuggestions(totalCents: number): number[] {
  const a = Math.ceil(totalCents / 1000) * 1000 > totalCents ? Math.ceil(totalCents / 1000) * 1000 : totalCents + 1000
  const b = a + 1000
  const c = (Math.floor(b / 5000) + 1) * 5000
  return [a, b, c]
}

export const paidOf = (payments: Payment[]) => payments.reduce((a, p) => a + p.cents, 0)
export const missingOf = (totalCents: number, payments: Payment[]) => Math.max(0, totalCents - paidOf(payments))
export const changeOf = (payments: Payment[]) => payments.reduce((a, p) => a + (p.method === 'cash' && p.receivedCents != null ? Math.max(0, p.receivedCents - p.cents) : 0), 0)
export const cashReceivedOf = (payments: Payment[]) => payments.filter((p) => p.method === 'cash').reduce((a, p) => a + (p.receivedCents ?? p.cents), 0)
/** Dinheiro que fica na gaveta por causa da venda (sem o troco devolvido). */
export const cashNetOf = (payments: Payment[]) => payments.filter((p) => p.method === 'cash').reduce((a, p) => a + p.cents, 0)

/** Pagamento em uma forma só. Dinheiro precisa de valor entregue igual ou maior que o total. */
export function singlePayment(method: PayMethod, totalCents: number, receivedCents?: number): Payment[] {
  if (totalCents <= 0) throw new PosError('invalid_payment')
  if (method === 'cash') {
    const received = receivedCents ?? totalCents
    if (received < totalCents) throw new PosError('invalid_payment', 'Valor entregue menor que o total')
    return [{ method, cents: totalCents, receivedCents: received }]
  }
  return [{ method, cents: totalCents }]
}

/** Uma parte de pagamento combinado. Passa do que falta? Fica só o que falta. Valor zero ou negativo é recusado. */
export function addPart(parts: Payment[], method: PayMethod, cents: number, totalCents: number): Payment[] {
  const part = Math.min(cents, missingOf(totalCents, parts))
  if (!(part > 0)) throw new PosError('invalid_amount')
  return [...parts, { method, cents: part }]
}

export function assertPaid(totalCents: number, payments: Payment[]): void {
  if (paidOf(payments) !== totalCents || payments.some((p) => !(p.cents > 0))) throw new PosError('invalid_payment')
}

export const nextSaleId = (ids: string[]) => `V-${String(ids.reduce((a, id) => Math.max(a, Number(id.slice(2)) || 0), 0) + 1).padStart(4, '0')}`

export type PosSale = {
  id: string
  sessionId: string
  at: string
  by: string
  lines: SaleLine[]
  subtotalCents: number
  discount: Discount | null
  totalCents: number
  payments: Payment[]
  changeCents: number
  status: 'completed' | 'cancelled'
  cancel: { at: string; by: string; approvedBy: string } | null
  /** Movimentações de estoque da venda (para estornar no cancelamento). */
  movementIds: string[]
  /** Venda de exemplo: o estoque dela já está nos saldos de exemplo. */
  seed?: boolean
  /** Feita sem conexão e ainda não enviada (H-I89). */
  pending?: boolean
}

/** Tira o estoque dos lotes que vencem primeiro; se passar de um lote, usa o próximo. Não deixa nenhum lote ficar negativo. */
export function pickLots(lots: Lot[], movements: StockMovement[], itemId: string, units: number): Array<{ lot: Lot; qty: number }> {
  const out: Array<{ lot: Lot; qty: number }> = []
  let left = Math.round(units * 10_000) / 10_000
  for (const l of lotsFefo(lots, movements, itemId)) {
    if (left <= 0) break
    const take = Math.min(left, l.balance)
    out.push({ lot: l, qty: Math.round(take * 10_000) / 10_000 })
    left = Math.round((left - take) * 10_000) / 10_000
  }
  if (left > 0) throw new PosError('insufficient_stock')
  return out
}

export const refundText = (sale: Pick<PosSale, 'payments' | 'totalCents'>, money: (c: number) => string): string => {
  const parts = sale.payments.map((p) => `${money(p.cents)} ${p.method === 'cash' ? 'em dinheiro' : p.method === 'pix' ? 'por Pix' : p.method === 'debit' ? 'no débito' : 'no crédito'}`)
  return `Devolva ${parts.join(' e ')} a quem comprou.`
}

// ---------- Caixa ----------

export type CashMovement = { id: string; at: string; kind: 'sangria' | 'suprimento'; cents: number; reason: string; by: string }

export type CashSession = {
  id: string
  openedAt: string
  openedBy: string
  /** Dinheiro contado ao abrir, para troco. */
  openingCents: number
  /** Vendas feitas antes deste sistema registrar uma a uma (exemplo): entram nos totais do caixa. */
  baseline: { count: number; cashCents: number; pixCents: number; cardCents: number }
  movements: CashMovement[]
  status: 'open' | 'closed'
  closedAt: string | null
  closedBy: string | null
  countedCents: number | null
  expectedCents: number | null
  /** Lançamento da diferença do fechamento no financeiro, para desfazer se o caixa for reaberto. */
  differenceTxId?: string | null
}

export const sangriaReasons = ['Levar ao banco', 'Troco para entregador', 'Pagamento em dinheiro']
export const suprimentoReasons = ['Reforço de troco']
export const movementValues = [5000, 10000, 20000]
export const openingValues = [10000, 15000, 20000]

const live = (sales: PosSale[], sessionId: string) => sales.filter((s) => s.sessionId === sessionId && s.status === 'completed')

export type SessionTotals = { count: number; cashCents: number; pixCents: number; cardCents: number; totalCents: number }

export function sessionTotals(session: CashSession, sales: PosSale[]): SessionTotals {
  const mine = live(sales, session.id)
  const by = (f: (p: Payment) => boolean) => mine.reduce((a, s) => a + s.payments.filter(f).reduce((x, p) => x + p.cents, 0), 0)
  const cashCents = session.baseline.cashCents + by((p) => p.method === 'cash')
  const pixCents = session.baseline.pixCents + by((p) => p.method === 'pix')
  const cardCents = session.baseline.cardCents + by((p) => isCard(p.method))
  return { count: session.baseline.count + mine.length, cashCents, pixCents, cardCents, totalCents: cashCents + pixCents + cardCents }
}

export const movementsTotal = (session: CashSession) => session.movements.reduce((a, m) => a + (m.kind === 'sangria' ? -m.cents : m.cents), 0)

/** Dinheiro que deve estar na gaveta: troco de abertura + vendas em dinheiro + suprimentos − sangrias. */
export function expectedCash(session: CashSession, sales: PosSale[]): number {
  return session.openingCents + sessionTotals(session, sales).cashCents + movementsTotal(session)
}

export const cashDifference = (countedCents: number, expectedCents: number) => countedCents - expectedCents

export function validateMovement(kind: CashMovement['kind'], cents: number, expectedCents: number): void {
  if (!(cents > 0)) throw new PosError('invalid_amount')
  if (kind === 'sangria' && cents > expectedCents) throw new PosError('invalid_amount', 'A gaveta não tem esse valor')
}
