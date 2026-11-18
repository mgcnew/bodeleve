import type { FinancialEntry, Lot, Movement, Purchase } from '@/domain/backoffice'
import { daysFromToday } from '@/domain/dates'
import { supabase } from '@/lib/supabase'
import { entriesStore, newId, purchasesStore, stockStore, supplierById } from './backoffice'
import { remoteClosePurchase, remoteCreatePurchase, remoteReceive, remoteUndoReceipt } from './backofficeRemote'
import { sessionStore } from './session'

export function nextPurchaseNumber() {
  const max = Math.max(0, ...purchasesStore.get().map((p) => Number(p.number.replace(/\D/g, ''))))
  return `PC-${String(max + 1).padStart(4, '0')}`
}

/** H-G7 — pedido sai pelo WhatsApp do fornecedor e fica salvo como "Enviado" */
export async function createPurchase(input: Pick<Purchase, 'supplierId' | 'expectedAt' | 'paymentTerms' | 'items'>, message = ''): Promise<{ id: string; number: string }> {
  if (supabase) {
    return remoteCreatePurchase({
      supplierId: input.supplierId,
      expectedAt: input.expectedAt,
      payment: input.paymentTerms,
      items: input.items.map((i) => ({ itemId: i.itemId, qty: i.qty })),
      message,
    })
  }
  const p: Purchase = { ...input, id: newId('pc'), number: nextPurchaseNumber(), status: 'sent', sentAt: new Date().toISOString(), receivedAt: null }
  purchasesStore.set((all) => [p, ...all])
  return { id: p.id, number: p.number }
}

/** Só números, com o 55 do Brasil na frente (sem repetir se já veio com ele) */
export function whatsappDigits(phone: string) {
  const d = phone.replace(/\D/g, '')
  return d.length > 11 && d.startsWith('55') ? d : `55${d}`
}

/** O número foi preenchido de verdade (e não é o marcador [WHATSAPP DA LOJA]) */
export function hasWhatsapp(phone: string) {
  return phone.replace(/\D/g, '').length >= 10
}

export function whatsappLink(phone: string, text: string) {
  return `https://wa.me/${whatsappDigits(phone)}?text=${encodeURIComponent(text)}`
}

export type ReceiptLine = { itemId: string; qty: number; lotCode: string; expiry: string | null }

export type Receipt = {
  purchaseId: string
  previous: Purchase
  /** valor da nota e vencimento da conta a pagar criada */
  totalCents: number
  dueAt: string
  /** id do recebimento no banco (com o Supabase) */
  receiptId?: string
  /** o que foi criado localmente, para desfazer (sem o Supabase) */
  local?: { lotIds: string[]; movementIds: string[]; entryId: string }
}

/**
 * H-G8/H-G9 — recebimento item a item com lote e validade. Entra no estoque e cria a
 * conta a pagar com o valor do que chegou. Devolve o necessário para desfazer.
 */
export async function receivePurchase(purchaseId: string, lines: ReceiptLine[]): Promise<Receipt> {
  const p = purchasesStore.get().find((x) => x.id === purchaseId)
  if (!p) throw new Error('compra não encontrada')
  const supplier = supplierById(p.supplierId)
  if (supabase) {
    // H-G9 — a conta a pagar vence conforme o prazo do fornecedor
    const dueAt = daysFromToday(supplier?.paymentDays ?? 0)
    const res = await remoteReceive(
      purchaseId,
      lines.map((l) => ({ lineId: p.items.find((i) => i.itemId === l.itemId)?.lineId ?? '', qty: l.qty, lot: l.lotCode, expiresAt: l.expiry })),
      dueAt,
      p.paymentTerms.split(',')[0],
    )
    return { purchaseId, previous: p, totalCents: Number(res.total_cents), dueAt, receiptId: res.receipt_id }
  }
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
  return { purchaseId: p.id, previous: p, totalCents: value, dueAt: entry.dueDate, local: { lotIds: lots.map((l) => l.id), movementIds: movements.map((m) => m.id), entryId: entry.id } }
}

/** Falta no recebimento: manter o restante em aberto ou encerrar o pedido */
export async function setPurchaseClosed(purchaseId: string, closed: boolean) {
  if (supabase) {
    // o banco só sabe encerrar; "manter em aberto" é o estado de partida
    if (closed) await remoteClosePurchase(purchaseId)
    return
  }
  purchasesStore.set((all) => all.map((x) => (x.id === purchaseId ? { ...x, status: closed ? 'received' : 'partially_received' } : x)))
}

/** "Corrigir conferência": desfaz o recebimento por inteiro */
export async function undoReceipt(r: Receipt) {
  if (supabase) return remoteUndoReceipt(r.receiptId!)
  const local = r.local!
  stockStore.set((s) => ({
    lots: s.lots.filter((l) => !local.lotIds.includes(l.id)),
    movements: s.movements.filter((m) => !local.movementIds.includes(m.id)),
  }))
  entriesStore.set((all) => all.filter((e) => e.id !== local.entryId))
  purchasesStore.set((all) => all.map((x) => (x.id === r.purchaseId ? r.previous : x)))
}
