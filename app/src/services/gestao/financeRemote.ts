// Financeiro no banco: contas (banco e caixa), contas a pagar/receber e lançamentos.
// As telas continuam lendo `accountsStore`, `entriesStore` e `ledgerStore`; com o Supabase ligado
// eles são caches alimentados aqui, e pagar uma conta chama `pay_entry` (valida saldo, registra
// multa e juros e lança a próxima despesa fixa) e `undo_payment`.
import { markLoaded } from '@/services/firstLoad'
import type { Account, FinancialEntry, LedgerTx } from '@/domain/backoffice'
import { supabase } from '@/lib/supabase'
import { accountsStore, entriesStore, ledgerStore } from './backoffice'
import { getEstablishmentId } from './backofficeRemote'

const one = <T,>(v: T | T[] | null | undefined) => (Array.isArray(v) ? v[0] : v) ?? null

/** As telas conhecem as contas por "banco" e "caixa"; o banco as distingue por `kind` */
const accountIds: Record<string, string> = { bank: 'banco', cash: 'caixa' }
export const accountKind = (id: string) => (id === 'banco' ? 'bank' : 'cash')

const originMap: Record<string, string> = { purchase: 'compra', sale: 'venda', pos: 'venda', online: 'venda' }

type EntryRow = {
  id: string
  direction: 'payable' | 'receivable'
  description: string
  title: string | null
  amount_cents: number
  due_at: string
  paid_at: string | null
  paid_cents: number | null
  origin: string
  ref: string | null
  recurring: boolean | null
  suppliers: { name?: string } | { name?: string }[] | null
}

type TxRow = {
  id: string
  at: string
  account_id: string
  amount_cents: number
  kind: 'opening' | 'sale' | 'payment' | 'settlement' | 'transfer' | 'manual'
  title: string
  note: string | null
  reversal_of: string | null
}

let loading: Promise<void> | null = null
let rerun: Promise<void> | null = null

export async function refreshFinance(): Promise<void> {
  if (!supabase) return
  if (loading) {
    // uma busca em andamento pode ter começado antes da ação que pediu esta: refaz logo depois dela
    rerun ??= loading.catch(() => undefined).then(() => {
      rerun = null
      return refreshFinance()
    })
    return rerun
  }
  loading = (async () => {
    const [accs, bal, entries, txs] = await Promise.all([
      supabase!.from('financial_accounts').select('id, kind, name'),
      supabase!.from('account_balances').select('account_id, balance_cents'),
      supabase!.from('financial_entries').select('id, direction, description, title, amount_cents, due_at, paid_at, paid_cents, origin, ref, recurring, suppliers(name)').order('due_at'),
      supabase!.from('financial_transactions').select('id, at, account_id, amount_cents, kind, title, note, reversal_of').order('at', { ascending: false }).limit(500),
    ])
    if (accs.error || !accs.data) return
    const kindOf = new Map((accs.data as { id: string; kind: string }[]).map((a) => [a.id, a.kind]))
    const balanceOf = new Map(((bal.data ?? []) as { account_id: string; balance_cents: number }[]).map((b) => [b.account_id, Number(b.balance_cents)]))

    // pagamentos desfeitos e seus estornos se anulam: ficam fora do histórico mostrado
    const rows = (txs.data ?? []) as TxRow[]
    const reversed = new Set(rows.filter((t) => t.reversal_of).map((t) => t.reversal_of))
    const hidden = (t: TxRow) => t.reversal_of !== null || reversed.has(t.id)
    const shown = rows.filter((t) => !hidden(t))

    const ledger: LedgerTx[] = shown.map((t) => {
      const amount = Number(t.amount_cents)
      const kind: LedgerTx['kind'] = t.kind === 'transfer' || t.kind === 'opening' ? 'transfer' : amount >= 0 ? 'in' : 'out'
      return {
        id: t.id,
        at: t.at,
        title: t.title,
        sub: `${t.kind === 'opening' ? 'Saldo inicial' : (accs.data as { id: string; name: string }[]).find((a) => a.id === t.account_id)?.name ?? ''}${t.note ? ` · ${t.note}` : ''}`,
        accountId: accountIds[kindOf.get(t.account_id) ?? ''] ?? 'banco',
        amountCents: amount,
        kind,
        entryId: null,
      }
    })

    // o saldo vem do banco (visão `account_balances`); o saldo inicial absorve o que ficou fora do histórico
    const accounts: Account[] = (accs.data as { id: string; kind: string; name: string }[]).map((a) => {
      const id = accountIds[a.kind] ?? a.kind
      const visible = ledger.filter((t) => t.accountId === id).reduce((n, t) => n + t.amountCents, 0)
      return { id, name: a.name, openingCents: (balanceOf.get(a.id) ?? 0) - visible }
    })

    const list: FinancialEntry[] = ((entries.data ?? []) as unknown as EntryRow[]).map((e) => ({
      id: e.id,
      direction: e.direction,
      description: e.title ?? e.description,
      counterpart: one(e.suppliers)?.name ?? e.title ?? e.description,
      categoryId: e.origin,
      amountCents: Number(e.amount_cents),
      dueDate: e.due_at,
      paidAt: e.paid_at,
      paidAmountCents: Number(e.paid_cents ?? 0),
      accountId: null,
      origin: originMap[e.origin] ?? e.origin,
      ref: e.ref,
      recurring: !!e.recurring,
    }))

    accountsStore.set(accounts)
    ledgerStore.set(ledger)
    entriesStore.set(list)
  })().finally(() => {
    loading = null
    markLoaded('finance')
  })
  return loading
}

export function startFinanceSync() {
  if (!supabase) return () => undefined
  void refreshFinance()
  const timer = setInterval(() => void refreshFinance(), 20_000)
  return () => clearInterval(timer)
}

export async function remotePay(input: { entryId: string; amountCents: number; extraCents: number; accountId: string; method: string; at: string }) {
  const { data, error } = await supabase!.rpc('pay_entry', {
    p_entry: input.entryId,
    p_amount_cents: input.amountCents,
    p_fine_cents: input.extraCents,
    p_account: accountKind(input.accountId),
    p_method: input.method,
    p_paid_at: input.at,
  })
  if (error) throw error
  await refreshFinance()
  return data as { transaction_id: string; balance_after: number; next_entry_id: string | null }
}

export async function remoteUndoPayment(transactionId: string) {
  const { error } = await supabase!.rpc('undo_payment', { p_transaction: transactionId })
  if (error) throw error
  await refreshFinance()
}

/** Saldo inicial de uma conta: o banco só aceita uma vez por conta (depois disso, só lançamentos) */
export async function remoteSetOpeningBalance(accountId: string, cents: number) {
  const { error } = await supabase!.rpc('set_opening_balance', { p_establishment: await getEstablishmentId(), p_account: accountKind(accountId), p_cents: cents })
  if (error) throw error
  await refreshFinance()
}

/** Mensagem para o que o banco recusa */
export function financeErrorMessage(e: unknown) {
  const msg = String((e as { message?: string })?.message ?? '')
  if (msg.includes('insufficient_balance')) return 'A conta escolhida não tem saldo para este pagamento. Escolha a outra conta ou pague só uma parte.'
  if (msg.includes('invalid_amount')) return 'O valor passa do que falta pagar. Confira o valor e a multa.'
  if (msg.includes('already_paid')) return 'Esta conta já foi paga. A tela foi atualizada.'
  if (msg.includes('cannot_reverse')) return 'Este pagamento não pode ser desfeito: a próxima conta lançada já recebeu pagamento.'
  if (msg.includes('already_set')) return 'Esta conta já tem saldo inicial. Para ajustar, faça um lançamento.'
  if (msg.includes('forbidden')) return 'Seu papel não permite esta ação.'
  return 'Não foi possível concluir. Nada foi alterado. Tente de novo.'
}
