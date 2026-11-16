import type { FinancialEntry, Lot, Movement, Purchase } from '@/domain/backoffice'
import { daysFromToday } from '@/domain/dates'
import { entriesStore, newId, purchasesStore, stockStore, supplierById } from './backoffice'
import { sessionStore } from './session'

export function nextPurchaseNumber() {
  const max = Math.max(0, ...purchasesStore.get().map((p) => Number(p.number.replace(/\D/g, ''))))
  return `PC-${String(max + 1).padStart(4, '0')}`
}

/** H-G7 — pedido sai pelo WhatsApp do fornecedor e fica salvo como "Enviado" */
export function createPurchase(input: Pick<Purchase, 'supplierId' | 'expectedAt' | 'paymentTerms' | 'items'>): Purchase {
  const p: Purchase = { ...input, id: newId('pc'), number: nextPurchaseNumber(), status: 'sent', sentAt: new Date().toISOString(), receivedAt: null }
  purchasesStore.set((all) => [p, ...all])
  return p
}

export function whatsappLink(phone: string, text: string) {
  return `https://wa.me/55${phone.replace(/\D/g, '')}?text=${encodeURIComponent(text)}`
}

export type ReceiptLine = { itemId: string; qty: number; lotCode: string; expiry: string | null }

export type Receipt = { purchaseId: string; lotIds: string[]; movementIds: string[]; entryId: string; previous: Purchase }

/**
 * H-G8/H-G9 — recebimento item a item com lote e validade. Entra no estoque e cria a
 * conta a pagar com o valor do que chegou. Devolve o necessário para desfazer.
 */
export function receivePurchase(purchaseId: string, lines: ReceiptLine[]): Receipt {
  const p = purchasesStore.get().find((x) => x.id === purchaseId)
  if (!p) throw new Error('compra não encontrada')
  const supplier = supplierById(p.supplierId)
  const now = new Date().toISOString()
  const by = sessionStore.get()?.name ?? 'Equipe'

  const lots: Lot[] = []
  const movements: Movement[] = []
  for (const line of lines) {
    if (line.qty <= 0) continue
    const cost = p.items.find((i) => i.itemId === line.itemId)?.unitCostCents ?? 0
    const lot: Lot | null = line.lotCode.trim()
      ? { id: newId('lot'), itemId: line.itemId, code: line.lotCode.trim(), expiry: line.expiry, unitCostCents: cost, createdAt: now }
      : null
    if (lot) lots.push(lot)
    movements.push({ id: newId('mv'), itemId: line.itemId, lotId: lot?.id ?? null, type: 'purchase_in', qty: line.qty, at: now, note: `Compra ${p.number}`, by, ref: p.id })
  }

  const received = p.items.map((i) => ({ ...i, receivedQty: i.receivedQty + (lines.find((l) => l.itemId === i.itemId)?.qty ?? 0) }))
  const complete = received.every((i) => i.receivedQty >= i.qty)
  const value = lines.reduce((n, l) => n + l.qty * (p.items.find((i) => i.itemId === l.itemId)?.unitCostCents ?? 0), 0)

  const entry: FinancialEntry = {
    id: newId('fe'),
    direction: 'payable',
    description: `Compra ${p.number}`,
    counterpart: supplier?.name ?? '',
    categoryId: 'compras',
    amountCents: value,
    dueDate: daysFromToday(supplier?.paymentDays ?? 0),
    paidAt: null,
    paidAmountCents: 0,
    accountId: null,
    origin: 'compra',
    ref: p.id,
    recurring: false,
  }

  stockStore.set((s) => ({ lots: [...s.lots, ...lots], movements: [...s.movements, ...movements] }))
  entriesStore.set((all) => [entry, ...all])
  purchasesStore.set((all) =>
    all.map((x) => (x.id === p.id ? { ...x, items: received, receivedAt: now, status: complete ? 'received' : 'partially_received' } : x)),
  )
  return { purchaseId: p.id, lotIds: lots.map((l) => l.id), movementIds: movements.map((m) => m.id), entryId: entry.id, previous: p }
}

/** Falta no recebimento: manter o restante em aberto ou encerrar o pedido */
export function setPurchaseClosed(purchaseId: string, closed: boolean) {
  purchasesStore.set((all) => all.map((x) => (x.id === purchaseId ? { ...x, status: closed ? 'received' : 'partially_received' } : x)))
}

/** "Corrigir conferência": desfaz o recebimento por inteiro */
export function undoReceipt(r: Receipt) {
  stockStore.set((s) => ({
    lots: s.lots.filter((l) => !r.lotIds.includes(l.id)),
    movements: s.movements.filter((m) => !r.movementIds.includes(m.id)),
  }))
  entriesStore.set((all) => all.filter((e) => e.id !== r.entryId))
  purchasesStore.set((all) => all.map((x) => (x.id === r.purchaseId ? r.previous : x)))
}
