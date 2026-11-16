import type { Account, FinancialEntry, LedgerTx } from '@/domain/backoffice'
import { daysUntil } from '@/domain/dates'
import { accountsStore, entriesStore, ledgerStore, newId } from './backoffice'

export function accountBalance(account: Account, ledger: LedgerTx[]) {
  return ledger.reduce((n, t) => (t.accountId === account.id ? n + t.amountCents : n), account.openingCents)
}

export function totalBalance(accounts: Account[], ledger: LedgerTx[]) {
  return accounts.reduce((n, a) => n + accountBalance(a, ledger), 0)
}

export const isOpen = (e: FinancialEntry) => !e.paidAt

export function openEntries(entries: FinancialEntry[], direction: FinancialEntry['direction']) {
  return entries.filter((e) => e.direction === direction && isOpen(e)).sort((a, b) => a.dueDate.localeCompare(b.dueDate))
}

/** saldo ainda a pagar ou receber de uma conta */
export const remaining = (e: FinancialEntry) => Math.max(0, e.amountCents - e.paidAmountCents)

export function overdueDays(e: FinancialEntry) {
  return Math.max(0, -daysUntil(e.dueDate))
}

function nextMonth(iso: string) {
  const d = new Date(iso)
  d.setMonth(d.getMonth() + 1)
  return d.toISOString()
}

export type Settlement = { entryId: string; previous: FinancialEntry; ledgerId: string; nextId: string | null }

/**
 * H-G23 — registra valor, multa e juros, data e origem. Para conta recorrente, a próxima
 * já fica lançada (H-G22). Serve para pagar (sai da conta) e para receber (entra).
 */
export function settleEntry(input: { entryId: string; amountCents: number; extraCents: number; at: string; accountId: string; method: string }): Settlement {
  const e = entriesStore.get().find((x) => x.id === input.entryId)
  if (!e) throw new Error('conta não encontrada')
  const total = input.amountCents + input.extraCents
  const pay = e.direction === 'payable'
  const tx: LedgerTx = {
    id: newId('lx'),
    at: input.at,
    title: pay ? `${e.description}${e.counterpart && e.description !== e.counterpart ? ` · ${e.counterpart}` : ''}` : e.description,
    sub: `${accountsStore.get().find((a) => a.id === input.accountId)?.name ?? ''} · ${input.method.toLowerCase()}`,
    accountId: input.accountId,
    amountCents: pay ? -total : total,
    kind: pay ? 'out' : 'in',
    entryId: e.id,
  }
  const next: FinancialEntry | null = e.recurring ? { ...e, id: newId('fe'), dueDate: nextMonth(e.dueDate), paidAt: null, paidAmountCents: 0, accountId: null } : null
  ledgerStore.set((l) => [tx, ...l])
  entriesStore.set((all) => [
    ...(next ? [next] : []),
    ...all.map((x) => (x.id === e.id ? { ...x, paidAt: input.at, paidAmountCents: total, accountId: input.accountId } : x)),
  ])
  return { entryId: e.id, previous: e, ledgerId: tx.id, nextId: next?.id ?? null }
}

export function undoSettlement(s: Settlement) {
  ledgerStore.set((l) => l.filter((t) => t.id !== s.ledgerId))
  entriesStore.set((all) => all.filter((x) => x.id !== s.nextId).map((x) => (x.id === s.entryId ? s.previous : x)))
}

export type ForecastDay = { day: string; label: string; netCents: number; balanceCents: number; text: string }

/** H-G21 — saldo previsto dia a dia (7 dias) a partir das contas a pagar e a receber */
export function forecast(entries: FinancialEntry[], startBalance: number, days = 7): ForecastDay[] {
  const open = entries.filter(isOpen)
  const buckets = new Map<string, FinancialEntry[]>()
  for (const e of open) {
    const d = Math.max(0, daysUntil(e.dueDate)) // atrasadas contam em "hoje"
    if (d > days) continue
    const key = String(d)
    buckets.set(key, [...(buckets.get(key) ?? []), e])
  }
  let balance = startBalance
  return [...buckets.entries()]
    .sort((a, b) => Number(a[0]) - Number(b[0]))
    .map(([d, list]) => {
      const net = list.reduce((n, e) => n + (e.direction === 'receivable' ? remaining(e) : -remaining(e)), 0)
      balance += net
      return {
        day: d,
        label: d === '0' ? 'Hoje' : '',
        netCents: net,
        balanceCents: balance,
        text: list.map((e) => `${e.description}${e.direction === 'payable' && overdueDays(e) > 0 ? ' (atrasado)' : ''}`).join(', '),
      }
    })
}
