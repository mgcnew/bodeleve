/**
 * Financeiro (H-G20 a H-G24): duas contas de dinheiro (banco e caixa/gaveta), contas a pagar e a receber, previsão de 7 dias.
 * O saldo de cada conta nunca é editável: é a soma dos lançamentos. Transferência entre contas não é entrada nem saída.
 */

export type AccountId = 'bank' | 'cash'
export const accountName: Record<AccountId, string> = { bank: 'Conta no banco', cash: 'Caixa (gaveta)' }
export const accountShort: Record<AccountId, string> = { bank: 'Banco', cash: 'Caixa' }

export type FinancialEntry = {
  id: string
  direction: 'payable' | 'receivable'
  /** Texto de origem usado na criação ("Laticínios Serra Verde · boleto"). */
  description: string
  amountCents: number
  dueAt: string
  paidAt: string | null
  origin: 'purchase' | 'sale' | 'manual' | 'fixed'
  /** Documento de origem: "PC-0057". */
  ref: string
  supplierId: string | null
  /** Quanto já foi pago ou recebido (pagamento parcial é permitido). */
  paidCents?: number
  /** Nome na lista ("Aluguel", "Laticínios Serra Verde", "Dona Zefa"). */
  title?: string
  /** "Despesa fixa", "Boleto · compra PC-0053", "Fiado". */
  kindLabel?: string
  /** "débito automático". */
  note?: string
  /** Nome curto na previsão ("Aluguel", "Laticínios", "Cartão de débito · liquidação"). */
  forecastLabel?: string
  /** Despesa que se repete todo mês: ao pagar, a próxima já fica lançada (H-G22). */
  recurring?: boolean
  /** Etiqueta própria: "Fiado". */
  tag?: string
  /** Despesa fixa criada automaticamente depois de pagar a anterior. */
  generatedFrom?: string
  /** Quando a conta nasceu (recebimento de compra): "Criada hoje". */
  createdAt?: string
}

export type TransactionKind = 'opening' | 'sale' | 'payment' | 'settlement' | 'transfer' | 'manual'

export type CashTransaction = {
  id: string
  at: string
  accountId: AccountId
  /** Positivo entra, negativo sai. */
  amountCents: number
  kind: TransactionKind
  title: string
  /** Complemento: "14 vendas", "Pix · categoria Insumos". */
  note: string
  entryId?: string
  /** Parte do pagamento que quitou a conta (o resto é multa e juros). */
  principalCents?: number
  /** As duas pontas de uma transferência. */
  transferId?: string
  reversalOf?: string
}

export class FinanceError extends Error {
  constructor(
    public code: 'not_found' | 'invalid_amount' | 'insufficient_balance' | 'already_paid' | 'cannot_reverse',
    public detail?: string,
  ) {
    super(code)
  }
}

export type FinanceState = { entries: FinancialEntry[]; transactions: CashTransaction[] }

export const paid = (e: FinancialEntry) => e.paidCents ?? (e.paidAt ? e.amountCents : 0)
export const remaining = (e: FinancialEntry) => Math.max(0, e.amountCents - paid(e))
export const isOpen = (e: FinancialEntry) => remaining(e) > 0

export const balanceOf = (tx: CashTransaction[], account: AccountId) => tx.filter((t) => t.accountId === account).reduce((a, t) => a + t.amountCents, 0)

const dayStart = (d: Date) => Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())
/** Dias de calendário entre hoje e a data: positivo = no futuro. */
export const daysFromToday = (iso: string, now: Date) => Math.round((dayStart(new Date(iso)) - dayStart(now)) / 86_400_000)

export type Standing = 'overdue' | 'today' | 'upcoming'
export function standingOf(e: FinancialEntry, now: Date): { standing: Standing; daysLate: number } {
  const d = daysFromToday(e.dueAt, now)
  return d < 0 ? { standing: 'overdue', daysLate: -d } : d === 0 ? { standing: 'today', daysLate: 0 } : { standing: 'upcoming', daysLate: 0 }
}

export function addMonth(iso: string): string {
  const d = new Date(iso)
  const next = new Date(d.getFullYear(), d.getMonth() + 1, 1, d.getHours())
  const lastDay = new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate()
  next.setDate(Math.min(d.getDate(), lastDay))
  return next.toISOString()
}

export function totals(entries: FinancialEntry[]) {
  const open = entries.filter(isOpen)
  const sum = (dir: FinancialEntry['direction']) => open.filter((e) => e.direction === dir).reduce((a, e) => a + remaining(e), 0)
  return { payableCents: sum('payable'), receivableCents: sum('receivable') }
}

export type ForecastRow = { key: string; label: string; description: string; deltaCents: number; balanceAfter: number }

/**
 * Saldo previsto dia a dia (H-G21): parte do saldo de agora e aplica o que vence em cada dia. O atrasado conta em "Hoje".
 * Só entram dias com movimento.
 */
export function forecast(entries: FinancialEntry[], startBalance: number, now: Date, days = 7): { rows: ForecastRow[]; finalBalance: number; finalLabel: string | null } {
  const byDay = new Map<number, FinancialEntry[]>()
  for (const e of entries.filter(isOpen)) {
    const d = Math.max(0, daysFromToday(e.dueAt, now))
    if (d > days) continue
    byDay.set(d, [...(byDay.get(d) ?? []), e])
  }
  let balance = startBalance
  const rows: ForecastRow[] = []
  for (const d of [...byDay.keys()].sort((a, b) => a - b)) {
    const list = byDay.get(d)!
    const delta = list.reduce((a, e) => a + (e.direction === 'receivable' ? remaining(e) : -remaining(e)), 0)
    balance += delta
    const names = list.map((e) => (e.forecastLabel ?? e.title ?? e.description) + (d === 0 && daysFromToday(e.dueAt, now) < 0 ? ' (atrasado)' : ''))
    const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() + d)
    rows.push({
      key: String(d),
      label: d === 0 ? 'Hoje' : `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}`,
      description: names.length > 1 ? `${names.slice(0, -1).join(', ')} e ${names[names.length - 1].toLowerCase()}` : names[0],
      deltaCents: delta,
      balanceAfter: balance,
    })
  }
  const last = rows[rows.length - 1]
  return { rows, finalBalance: balance, finalLabel: last ? last.label : null }
}

const nextId = (prefix: string, ids: string[]) => `${prefix}${ids.reduce((a, id) => Math.max(a, Number(id.slice(prefix.length)) || 0), 0) + 1}`

export type PayInput = { amountCents: number; fineCents: number; accountId: AccountId; method: string; paidAt: string; receiptName?: string }

/**
 * Baixa uma conta a pagar (H-G23): registra valor, multa e juros, data, de onde saiu e a forma. Avisa se o saldo da origem não cobre.
 * Pagamento parcial deixa o restante em aberto. Despesa fixa lança a próxima do mês seguinte.
 */
export function payEntry(st: FinanceState, entryId: string, input: PayInput, now: Date): { entry: FinancialEntry; balanceAfter: number; next: FinancialEntry | null; transactionId: string } {
  const e = st.entries.find((x) => x.id === entryId)
  if (!e || e.direction !== 'payable') throw new FinanceError('not_found')
  if (!isOpen(e)) throw new FinanceError('already_paid')
  if (!(input.amountCents > 0) || input.amountCents > remaining(e) || input.fineCents < 0) throw new FinanceError('invalid_amount')
  const total = input.amountCents + input.fineCents
  const have = balanceOf(st.transactions, input.accountId)
  if (have < total) throw new FinanceError('insufficient_balance', String(have))
  const txId = nextId('tx-', st.transactions.map((t) => t.id))
  st.transactions.push({
    id: txId, at: input.paidAt, accountId: input.accountId, amountCents: -total, kind: 'payment',
    title: e.title ?? e.description, note: `${input.method}${e.ref ? ` · ${e.ref}` : ''}${input.fineCents > 0 ? ' · com multa e juros' : ''}`, entryId: e.id, principalCents: input.amountCents,
  })
  e.paidCents = paid(e) + input.amountCents
  let next: FinancialEntry | null = null
  if (remaining(e) === 0) {
    e.paidAt = input.paidAt
    if (e.recurring) {
      next = { ...e, id: nextId('fe-', st.entries.map((x) => x.id)), dueAt: addMonth(e.dueAt), paidAt: null, paidCents: 0, generatedFrom: e.id }
      st.entries.push(next)
    }
  }
  void now
  return { entry: e, balanceAfter: balanceOf(st.transactions, input.accountId), next, transactionId: txId }
}

/** Desfaz o pagamento com um lançamento contrário (o histórico fica) e tira a próxima despesa fixa, se ainda não foi mexida. */
export function undoPayment(st: FinanceState, transactionId: string, now: Date): FinancialEntry {
  const tx = st.transactions.find((t) => t.id === transactionId)
  const e = tx?.entryId ? st.entries.find((x) => x.id === tx.entryId) : null
  if (!tx || !e) throw new FinanceError('not_found')
  if (st.transactions.some((t) => t.reversalOf === transactionId)) throw new FinanceError('cannot_reverse')
  // A próxima despesa fixa só some se ninguém mexeu nela.
  const follow = st.entries.filter((x) => x.generatedFrom === e.id)
  if (follow.some((x) => paid(x) > 0)) throw new FinanceError('cannot_reverse')
  st.transactions.push({ id: nextId('tx-', st.transactions.map((t) => t.id)), at: now.toISOString(), accountId: tx.accountId, amountCents: -tx.amountCents, kind: 'manual', title: `Pagamento desfeito · ${tx.title}`, note: '', entryId: e.id, reversalOf: transactionId })
  e.paidCents = Math.max(0, paid(e) - (tx.principalCents ?? -tx.amountCents))
  if (remaining(e) > 0) e.paidAt = null
  st.entries = st.entries.filter((x) => x.generatedFrom !== e.id)
  return e
}

export type LedgerRow = { id: string; at: string; kind: 'in' | 'out' | 'transfer'; title: string; detail: string; amountCents: number }

/** Lançamentos visíveis: vendas, compras/contas pagas e liquidações; a transferência aparece uma vez só e não conta como entrada nem saída. */
export function ledger(transactions: CashTransaction[]): LedgerRow[] {
  const rows: LedgerRow[] = []
  const seen = new Set<string>()
  for (const t of transactions) {
    if (t.kind === 'opening' || t.reversalOf || transactions.some((x) => x.reversalOf === t.id)) continue
    if (t.kind === 'transfer') {
      const key = t.transferId ?? t.id
      if (seen.has(key)) continue
      seen.add(key)
      const out = transactions.find((x) => (x.transferId ?? x.id) === key && x.amountCents < 0) ?? t
      const into = transactions.find((x) => (x.transferId ?? x.id) === key && x.amountCents > 0)
      rows.push({ id: out.id, at: out.at, kind: 'transfer', title: out.title, detail: `${accountShort[out.accountId]} → ${accountShort[into?.accountId ?? 'bank'].toLowerCase()} · transferência entre contas`, amountCents: Math.abs(out.amountCents) })
      continue
    }
    rows.push({ id: t.id, at: t.at, kind: t.amountCents >= 0 ? 'in' : 'out', title: t.title, detail: `${accountShort[t.accountId]}${t.note ? ` · ${t.note}` : ''}`, amountCents: t.amountCents })
  }
  return rows.sort((a, b) => b.at.localeCompare(a.at))
}

export function ledgerTotals(rows: LedgerRow[]) {
  return {
    inCents: rows.filter((r) => r.kind === 'in').reduce((a, r) => a + r.amountCents, 0),
    outCents: rows.filter((r) => r.kind === 'out').reduce((a, r) => a + Math.abs(r.amountCents), 0),
  }
}
