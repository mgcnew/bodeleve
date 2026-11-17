// PDV: sacola, caixa e vendas. Hoje em stores no aparelho; com o Supabase vira `orders` (channel pos),
// `payments`, `cash_sessions` e `cash_movements`, com fila local para funcionar em conexão ruim (H-P7).
import { daysFromToday } from '@/domain/dates'
import type { CartLine, CashSession, Discount, PayMethod, Payment, PosCart, Sale } from '@/domain/pdv'
import { cartSubtotal, cartTotal, lineTotal } from '@/domain/pdv'
import type { FinancialEntry, LedgerTx } from '@/domain/backoffice'
import { createStore } from '@/lib/store'
import { supabase } from '@/lib/supabase'
import { seedCash, seedSales } from '@/mocks/pdv/seed'
import { entriesStore, ledgerStore, newId, stockStore } from './gestao/backoffice'
import { sessionStore } from './gestao/session'
import { fefoOut } from './gestao/stock'
import { remoteCancelSale, remoteCashMovement, remoteCheckout, remoteCloseCash, remoteOpenCash, remoteReopenCash } from './pdvRemote'

export const cartStore = createStore<PosCart>('bodeleve.pdv.sacola', () => ({ lines: [], discount: null }))
// com o Supabase são cache do banco (alimentado por pdvRemote); sem ele, dados de exemplo no aparelho
export const salesStore = createStore<Sale[]>(supabase ? 'bodeleve.pdv.vendas.remoto' : 'bodeleve.pdv.vendas', () => (supabase ? [] : seedSales()))
export const cashStore = createStore<{ session: CashSession | null; lastClose: { at: string; diffCents: number } | null }>(supabase ? 'bodeleve.pdv.caixa.remoto' : 'bodeleve.pdv.caixa', () => (supabase ? { session: null, lastClose: null } : seedCash()))

/** H-P7 — vendas feitas sem internet, na ordem em que aconteceram; enviadas sozinhas quando a conexão volta (pdvRemote) */
export type QueuedSale = { id: string; at: string; seller: string; cart: PosCart; payments: Payment[]; /** já houve uma tentativa sem resposta: pode ter chegado ao servidor */ attempted: boolean; error?: string }
export const queueStore = createStore<QueuedSale[]>('bodeleve.pdv.fila', () => [])

const by = () => sessionStore.get()?.name ?? 'Equipe'

// ---------- sacola ----------
export function addToCart(line: Omit<CartLine, 'quantity'> & { quantity?: number }) {
  cartStore.set((c) => {
    const found = c.lines.find((l) => l.itemId === line.itemId)
    // por peso, cada pesagem soma ao que já está na sacola; unitário soma 1
    const lines = found
      ? c.lines.map((l) => (l.itemId === line.itemId ? { ...l, quantity: l.quantity + (line.quantity ?? 1), grams: l.grams !== null ? l.grams + (line.grams ?? 0) : null } : l))
      : [...c.lines, { ...line, quantity: line.quantity ?? 1 }]
    return { ...c, lines, discount: null }
  })
}

export function setLineQty(itemId: string, quantity: number) {
  cartStore.set((c) => ({ ...c, discount: null, lines: quantity <= 0 ? c.lines.filter((l) => l.itemId !== itemId) : c.lines.map((l) => (l.itemId === itemId ? { ...l, quantity } : l)) }))
}

export function setLineGrams(itemId: string, grams: number) {
  cartStore.set((c) => ({ ...c, discount: null, lines: grams <= 0 ? c.lines.filter((l) => l.itemId !== itemId) : c.lines.map((l) => (l.itemId === itemId ? { ...l, grams } : l)) }))
}

export function clearCart() {
  cartStore.reset()
}

/** H-P5 — atalhos de desconto: 5%, 10%, R$ 5, arredondar; com motivo */
export type DiscountPreset = 'p5' | 'p10' | 'r5' | 'round'
export const presetLabels: Record<DiscountPreset, string> = { p5: '5%', p10: '10%', r5: 'R$ 5,00', round: 'Arredondar' }

export function discountFor(preset: DiscountPreset, subtotal: number): { label: string; cents: number } {
  if (preset === 'p5') return { label: 'Desconto 5%', cents: Math.round(subtotal * 0.05) }
  if (preset === 'p10') return { label: 'Desconto 10%', cents: Math.round(subtotal * 0.1) }
  if (preset === 'r5') return { label: 'Desconto', cents: Math.min(500, subtotal) }
  return { label: 'Arredondamento', cents: subtotal % 100 }
}

export function applyDiscount(d: Discount | null) {
  cartStore.set((c) => ({ ...c, discount: d && d.cents > 0 ? d : null }))
}

// ---------- caixa ----------
export async function openCash(floatCents: number) {
  if (supabase) return remoteOpenCash(floatCents)
  cashStore.set((s) => ({
    ...s,
    session: { id: newId('cx'), openedAt: new Date().toISOString(), openedBy: by(), floatCents, movements: [], closedAt: null, countedCents: null, expectedCents: null },
  }))
}

export function cashSales(session: CashSession, sales: Sale[]) {
  return sales
    .filter((s) => s.status === 'done' && s.at >= session.openedAt)
    .flatMap((s) => s.payments.filter((p) => p.method === 'cash'))
    .reduce((n, p) => n + p.cents, 0)
}

export function expectedCash(session: CashSession, sales: Sale[]) {
  const moved = session.movements.reduce((n, m) => n + (m.kind === 'supply' ? m.cents : -m.cents), 0)
  return session.floatCents + cashSales(session, sales) + moved
}

const toBank = 'Levar ao banco'
const reinforce = 'Reforço de troco'
const cashPayment = 'Pagamento em dinheiro'

export const withdrawalReasons = [toBank, 'Troco para entregador', cashPayment]
export const supplyReasons = [reinforce]

/** Sangria ou suprimento. Entre caixa e banco é transferência, que não conta como entrada nem saída (H-G20). */
export async function addCashMovement(kind: 'withdrawal' | 'supply', cents: number, reason: string) {
  if (supabase) return remoteCashMovement(kind, cents, reason)
  const at = new Date().toISOString()
  const leg = (accountId: string, amount: number, k: LedgerTx['kind'], title: string, sub: string): LedgerTx => ({ id: newId('lx'), at, title, sub, accountId, amountCents: amount, kind: k, entryId: null })
  const tx: LedgerTx[] = []
  if (kind === 'withdrawal' && reason === toBank) {
    tx.push(leg('caixa', -cents, 'transfer', 'Sangria do caixa', 'Caixa → banco · transferência entre contas'), leg('banco', cents, 'transfer', 'Sangria do caixa', 'Caixa → banco · transferência entre contas'))
  } else if (kind === 'supply' && reason === reinforce) {
    tx.push(leg('banco', -cents, 'transfer', 'Reforço de troco', 'Banco → caixa · transferência entre contas'), leg('caixa', cents, 'transfer', 'Reforço de troco', 'Banco → caixa · transferência entre contas'))
  } else if (kind === 'withdrawal' && reason === cashPayment) {
    tx.push(leg('caixa', -cents, 'out', 'Pagamento em dinheiro', 'Caixa · saída do balcão'))
  }
  if (tx.length) ledgerStore.set((l) => [...tx, ...l])
  cashStore.set((s) =>
    s.session ? { ...s, session: { ...s.session, movements: [...s.session.movements, { id: newId('cm'), kind, cents, reason, at }] } } : s,
  )
}

export async function closeCash(countedCents: number) {
  if (supabase) {
    // vendas ainda no aparelho cairiam no caixa seguinte; espera enviarem
    if (queueStore.get().length > 0) throw new Error('queue_pending')
    return remoteCloseCash(countedCents)
  }
  cashStore.set((s) => {
    if (!s.session) return s
    const expected = expectedCash(s.session, salesStore.get())
    return { session: { ...s.session, closedAt: new Date().toISOString(), countedCents, expectedCents: expected }, lastClose: { at: new Date().toISOString(), diffCents: countedCents - expected } }
  })
}

export async function reopenCash() {
  if (supabase) return remoteReopenCash()
  cashStore.set((s) => (s.session ? { ...s, session: { ...s.session, closedAt: null, countedCents: null, expectedCents: null } } : s))
}

// ---------- vendas ----------
export function nextSaleNumber() {
  const max = Math.max(0, ...salesStore.get().map((s) => Number(s.number.replace(/\D/g, ''))))
  return `V-${String(max + 1).padStart(4, '0')}`
}

/** quanto falta de estoque para atender a sacola; vazio se tudo cobre */
export function stockShortages(cart: PosCart, available: (itemId: string) => number) {
  return cart.lines
    .map((l) => ({ line: l, have: available(l.itemId), need: l.grams !== null ? l.grams / 1000 : l.quantity }))
    .filter((x) => x.need > x.have)
}

/**
 * H-P3/H-P4 — conclui a venda: baixa o estoque pelo lote que vence antes e lança o dinheiro.
 * Dinheiro entra no caixa; Pix no banco; cartão fica a receber (H-G24).
 */
export async function completeSale(cart: PosCart, payments: Payment[]): Promise<Sale> {
  if (supabase) return remoteCheckout(cart, payments)
  const now = new Date().toISOString()
  const number = nextSaleNumber()
  const seller = by()
  const id = `v-${number.slice(2)}`

  const lines = cart.lines.map((l) => ({ itemId: l.itemId, name: l.name, grams: l.grams, quantity: l.quantity, unitPriceCents: l.unitPriceCents, totalCents: lineTotal(l), lotCode: null as string | null }))
  const movements = cart.lines.flatMap((l) =>
    fefoOut({ itemId: l.itemId, qty: l.grams !== null ? l.grams / 1000 : l.quantity, type: 'sale_out', note: 'Venda no balcão', ref: id, by: seller, at: now }),
  )
  const lots = stockStore.get().lots
  lines.forEach((l, i) => {
    const first = movements.find((m) => m.itemId === cart.lines[i].itemId && m.lotId)
    l.lotCode = lots.find((x) => x.id === first?.lotId)?.code ?? null
  })

  const total = cartTotal(cart)
  const ledger: LedgerTx[] = []
  const entries: FinancialEntry[] = []
  for (const p of payments) {
    if (p.method === 'cash') ledger.push({ id: newId('lx'), at: now, title: 'Vendas no balcão · dinheiro', sub: `Caixa · ${number}`, accountId: 'caixa', amountCents: p.cents, kind: 'in', entryId: null })
    else if (p.method === 'pix') ledger.push({ id: newId('lx'), at: now, title: 'Vendas no Pix', sub: `Banco · balcão · ${number}`, accountId: 'banco', amountCents: p.cents, kind: 'in', entryId: null })
    else
      entries.push({
        id: newId('fe'), direction: 'receivable', description: p.method === 'debit' ? 'Cartão de débito' : 'Cartão de crédito', counterpart: 'Maquininha', categoryId: 'vendas', amountCents: p.cents,
        dueDate: daysFromToday(p.method === 'debit' ? 1 : 30), paidAt: null, paidAmountCents: 0, accountId: null, origin: 'venda', ref: id, recurring: false,
      })
  }

  const cashPart = payments.find((p) => p.method === 'cash')
  const sale: Sale = {
    id, number, at: now, by: seller, lines,
    subtotalCents: cartSubtotal(cart), discountCents: cart.discount?.cents ?? 0, discountLabel: cart.discount?.label ?? null, discountReason: cart.discount?.reason ?? null,
    totalCents: total, payments,
    changeCents: cashPart?.receivedCents ? Math.max(0, cashPart.receivedCents - cashPart.cents) : 0,
    status: 'done', cancelledAt: null, cancelledBy: null,
    effects: { movementIds: movements.map((m) => m.id), ledgerIds: ledger.map((l) => l.id), entryIds: entries.map((e) => e.id) },
  }
  stockStore.set((s) => ({ ...s, movements: [...s.movements, ...movements] }))
  if (ledger.length) ledgerStore.set((l) => [...ledger, ...l])
  if (entries.length) entriesStore.set((e) => [...entries, ...e])
  salesStore.set((all) => [sale, ...all])
  // a sacola é esvaziada na tela de venda concluída: esvaziar aqui faria as telas de cobrança voltarem a /pdv antes
  return sale
}

/**
 * H-P6 — cancelar exige senha de gestor; itens voltam ao estoque e o dinheiro lançado é desfeito.
 * Com o Supabase o banco confere a senha (`pin`); sem ele, `pin` só precisa existir e quem aprovou é fixo.
 */
export async function cancelSale(id: string, pin: string) {
  if (supabase) return remoteCancelSale(id, pin)
  const managerName = 'Ana (gestora)'
  const sale = salesStore.get().find((s) => s.id === id)
  if (!sale || sale.status === 'cancelled') return
  stockStore.set((s) => ({ ...s, movements: s.movements.filter((m) => !sale.effects.movementIds.includes(m.id)) }))
  ledgerStore.set((l) => l.filter((t) => !sale.effects.ledgerIds.includes(t.id)))
  entriesStore.set((e) => e.filter((x) => !sale.effects.entryIds.includes(x.id)))
  salesStore.set((all) => all.map((s) => (s.id === id ? { ...s, status: 'cancelled', cancelledAt: new Date().toISOString(), cancelledBy: managerName } : s)))
}

export type { PayMethod }
