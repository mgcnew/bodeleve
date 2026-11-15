import type { FinancialEntry } from './finance'
import type { Lot, StockItem, StockMovement } from './inventory'
import { lotBalance } from './inventory'
import { paymentTerms, validateReceipt, type PurchaseOrder, type ReceiptErrors, type ReceiptLine } from './purchasing'

/** Recebimento de mercadoria (H-G8, H-G9): dá entrada em lotes, cria a conta a pagar e aceita recebimento parcial. */

export type Receipt = {
  id: string
  orderId: string
  at: string
  lotIds: string[]
  movementIds: string[]
  payableId: string | null
  /** Para poder corrigir a conferência: o pedido volta ao que era antes. */
  before: { status: PurchaseOrder['status']; closedShort: boolean; receivedAt: string | null; receivedQty: Record<string, number> }
}

export type ReceivingState = {
  purchaseOrders: PurchaseOrder[]
  lots: Lot[]
  movements: StockMovement[]
  payables: FinancialEntry[]
  receipts: Receipt[]
}

export class ReceivingError extends Error {
  constructor(
    public code: 'not_found' | 'invalid_state' | 'invalid_lines' | 'cannot_reverse',
    public errors?: ReceiptErrors,
  ) {
    super(code)
  }
}

export type ReceiveResult = {
  order: PurchaseOrder
  entered: Array<{ itemId: string; itemName: string; lotCode: string; expiresAt: string | null; qty: number }>
  payable: { description: string; amountCents: number; dueAt: string } | null
  shortfall: Array<{ itemId: string; name: string; missing: number }>
}

const next = (prefix: string, existing: string[]) => {
  const max = existing.reduce((a, id) => Math.max(a, Number(id.slice(prefix.length)) || 0), 0)
  return `${prefix}${max + 1}`
}

const addDays = (now: Date, days: number) => new Date(now.getFullYear(), now.getMonth(), now.getDate() + days, 12).toISOString()

/** Aplica um recebimento ao estado (altera o estado recebido). `closeShort` decide o que fazer com o que faltou. */
export function receive(
  state: ReceivingState,
  orderId: string,
  lines: ReceiptLine[],
  opts: { closeShort: boolean; now: Date; supplierName: string; items: StockItem[] },
): ReceiveResult {
  const order = state.purchaseOrders.find((o) => o.id === orderId)
  if (!order) throw new ReceivingError('not_found')
  if (order.status !== 'sent' && order.status !== 'partially_received') throw new ReceivingError('invalid_state')
  const errors = validateReceipt(order, lines, opts.items)
  if (Object.keys(errors).length) throw new ReceivingError('invalid_lines', errors)

  const nowIso = opts.now.toISOString()
  const before = {
    status: order.status,
    closedShort: order.closedShort,
    receivedAt: order.receivedAt,
    receivedQty: Object.fromEntries(order.items.map((i) => [i.itemId, i.receivedQty])),
  }
  const receiptId = next('RC-', state.receipts.map((r) => r.id))
  const lotIds: string[] = []
  const movementIds: string[] = []
  const entered: ReceiveResult['entered'] = []
  let amount = 0

  for (const l of lines) {
    if (!(l.qty > 0)) continue
    const po = order.items.find((i) => i.itemId === l.itemId)!
    po.receivedQty += l.qty
    amount += l.qty * po.unitCostCents
    let lot = state.lots.find((x) => x.itemId === l.itemId && x.code === l.lot.trim())
    if (!lot) {
      lot = { id: next('lot-', state.lots.map((x) => x.id)), itemId: l.itemId, code: l.lot.trim(), expiresAt: l.expiresAt, unitCostCents: po.unitCostCents, receivedAt: nowIso, source: order.id }
      state.lots.push(lot)
      lotIds.push(lot.id)
    }
    const mvId = next('mv-', state.movements.map((m) => m.id))
    state.movements.push({ id: mvId, itemId: l.itemId, lotId: lot.id, type: 'purchase_in', qty: l.qty, at: nowIso, ref: order.id })
    movementIds.push(mvId)
    entered.push({ itemId: l.itemId, itemName: po.name, lotCode: lot.code, expiresAt: lot.expiresAt, qty: l.qty })
  }

  const shortfall = order.items.filter((i) => i.receivedQty < i.qty).map((i) => ({ itemId: i.itemId, name: i.name, missing: i.qty - i.receivedQty }))
  if (shortfall.length === 0) {
    order.status = 'received'
    order.closedShort = false
    order.receivedAt = nowIso
  } else if (opts.closeShort) {
    order.status = 'received'
    order.closedShort = true
    order.receivedAt = nowIso
  } else {
    order.status = 'partially_received'
  }

  // H-G9: a conta nasce no recebimento, com o valor do que chegou, e vence conforme o prazo do fornecedor.
  let payable: ReceiveResult['payable'] = null
  let payableId: string | null = null
  if (amount > 0) {
    const term = paymentTerms[order.payment]
    const dueAt = addDays(opts.now, term.dueDays ?? 0)
    const kind = order.payment === 'boleto14' ? 'boleto' : order.payment === 'pix_on_delivery' ? 'Pix' : 'dinheiro'
    payableId = next('fe-', state.payables.map((p) => p.id))
    const description = `${opts.supplierName} · ${kind}`
    state.payables.push({ id: payableId, direction: 'payable', description, amountCents: amount, dueAt, paidAt: null, origin: 'purchase', ref: order.id, supplierId: order.supplierId })
    payable = { description, amountCents: amount, dueAt }
  }

  state.receipts.push({ id: receiptId, orderId: order.id, at: nowIso, lotIds, movementIds, payableId, before })
  return { order, entered, payable, shortfall }
}

/** "Encerrar o pedido assim": o que faltou não será entregue; o pedido passa a "Recebido parcial". */
export function closeShortOrder(state: ReceivingState, orderId: string, now: Date): PurchaseOrder {
  const order = state.purchaseOrders.find((o) => o.id === orderId)
  if (!order) throw new ReceivingError('not_found')
  if (order.status !== 'partially_received') throw new ReceivingError('invalid_state')
  order.status = 'received'
  order.closedShort = true
  order.receivedAt = now.toISOString()
  return order
}

/** Corrige a conferência do último recebimento do pedido: só se nada saiu dos lotes e a conta ainda não foi paga. */
export function reverseLastReceipt(state: ReceivingState, orderId: string): PurchaseOrder {
  const order = state.purchaseOrders.find((o) => o.id === orderId)
  const receipt = [...state.receipts].reverse().find((r) => r.orderId === orderId)
  if (!order || !receipt) throw new ReceivingError('not_found')
  const payable = receipt.payableId ? state.payables.find((p) => p.id === receipt.payableId) : null
  if (payable?.paidAt) throw new ReceivingError('cannot_reverse')
  for (const mvId of receipt.movementIds) {
    const m = state.movements.find((x) => x.id === mvId)
    // Se o lote já teve saída, o saldo atual é menor que o que entrou: corrigir exigiria um ajuste de estoque.
    if (m?.lotId && lotBalance(state.movements, m.lotId) < m.qty) throw new ReceivingError('cannot_reverse')
  }
  state.movements = state.movements.filter((m) => !receipt.movementIds.includes(m.id))
  state.lots = state.lots.filter((l) => !receipt.lotIds.includes(l.id))
  if (receipt.payableId) state.payables = state.payables.filter((p) => p.id !== receipt.payableId)
  order.status = receipt.before.status
  order.closedShort = receipt.before.closedShort
  order.receivedAt = receipt.before.receivedAt
  for (const i of order.items) i.receivedQty = receipt.before.receivedQty[i.itemId] ?? 0
  state.receipts = state.receipts.filter((r) => r.id !== receipt.id)
  return order
}
