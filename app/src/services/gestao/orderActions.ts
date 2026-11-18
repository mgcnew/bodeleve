// Ações da fila de pedidos. Com o Supabase, chamam as funções do banco (que confirmam, baixam o
// estoque pelo lote e avisam o cliente); sem ele, mudam o estado local de exemplo.
import { supabase } from '@/lib/supabase'
import { setStatus, staffOrdersStore } from './orders'
import { daysFromToday } from '@/domain/dates'
import { customersStore } from './people'
import { entriesStore, newId } from './backoffice'
import { remoteAccept, remoteCompletePickup, remoteMarkReady, remoteSetPayment, remoteUndoReady } from './ordersRemote'

const find = (id: string) => staffOrdersStore.get().find((o) => o.id === id)

export async function acceptOrder(id: string) {
  if (supabase) return remoteAccept(id)
  const o = find(id)
  if (o?.onAccount && !creditDaysOf(o)) throw new Error('no_credit')
  setStatus(id, 'separating')
}

export async function markOrderReady(id: string) {
  if (supabase) {
    const o = find(id)
    const ids = (o?.itemIds ?? []).filter((_, i) => o?.checked[i])
    return remoteMarkReady(id, ids)
  }
  setStatus(id, 'ready')
}

export async function undoOrderReady(id: string) {
  if (supabase) return remoteUndoReady(id)
  setStatus(id, 'separating')
}

const digits = (s: string) => s.replace(/\D/g, '')

/** Prazo em dias do cliente do pedido (pelo celular), ou null */
export function creditDaysOf(order: { customer: { phone: string } }) {
  return customersStore.get().find((c) => digits(c.phone) === digits(order.customer.phone))?.creditDays ?? null
}

export async function completePickup(id: string) {
  if (supabase) return remoteCompletePickup(id)
  const o = find(id)
  const days = o?.onAccount ? creditDaysOf(o) : null
  if (o?.onAccount) {
    if (!days) throw new Error('no_credit')
    // pedido a prazo: a retirada gera a conta a receber do cliente
    const total = o.items.reduce((n, i) => n + i.quantity * i.unitPriceCents, 0) + o.feeCents
    entriesStore.set((all) => [
      { id: newId('fe'), direction: 'receivable', description: o.customer.name, counterpart: o.customer.name, categoryId: 'vendas', amountCents: total, dueDate: daysFromToday(days), paidAt: null, paidAmountCents: 0, accountId: null, origin: 'venda', ref: o.number, recurring: false },
      ...all,
    ])
    patchPaid(id, false)
  }
  setStatus(id, 'delivered')
}

function patchPaid(id: string, paid: boolean) {
  staffOrdersStore.set((all) => all.map((x) => (x.id === id ? { ...x, paid } : x)))
}

/** O dono muda o pagamento do pedido: "a prazo" (só se o cliente tem prazo) ou "na retirada" */
export async function setOrderPayment(id: string, method: 'on_pickup' | 'on_account') {
  if (supabase) return remoteSetPayment(id, method)
  const o = find(id)
  if (method === 'on_account' && o && !creditDaysOf(o)) throw new Error('no_credit')
  staffOrdersStore.set((all) => all.map((x) => (x.id === id ? { ...x, onAccount: method === 'on_account', paymentLabel: method === 'on_account' ? 'A prazo' : 'Pagar na retirada' } : x)))
}

/** Mensagem para o que o banco recusa (`raise exception`) */
export function actionErrorMessage(e: unknown) {
  const msg = String((e as { message?: string })?.message ?? '')
  if (msg.includes('no_credit')) return 'Este cliente não tem prazo cadastrado. Cadastre o prazo na tela do cliente ou mude o pagamento para "na retirada".'
  if (msg.includes('items_not_checked')) return 'Confira todos os itens antes de marcar como pronto.'
  if (msg.includes('invalid_transition')) return 'Este pedido já mudou de situação. A tela foi atualizada.'
  if (msg.includes('out_of_stock') || msg.includes('insufficient')) return 'Falta estoque para separar este pedido. Confira o estoque e tente de novo.'
  if (msg.includes('forbidden') || msg.includes('not_allowed') || msg.includes('permission')) return 'Seu papel não permite esta ação.'
  return 'Não foi possível concluir. Nada foi alterado. Tente de novo.'
}
