// Ações da fila de pedidos. Com o Supabase, chamam as funções do banco (que confirmam, baixam o
// estoque pelo lote e avisam o cliente); sem ele, mudam o estado local de exemplo.
import { supabase } from '@/lib/supabase'
import { setStatus, staffOrdersStore } from './orders'
import { remoteAccept, remoteCompletePickup, remoteMarkReady, remoteUndoReady } from './ordersRemote'

const find = (id: string) => staffOrdersStore.get().find((o) => o.id === id)

export async function acceptOrder(id: string) {
  if (supabase) return remoteAccept(id)
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

export async function completePickup(id: string) {
  if (supabase) return remoteCompletePickup(id)
  setStatus(id, 'delivered')
}

/** Mensagem para o que o banco recusa (`raise exception`) */
export function actionErrorMessage(e: unknown) {
  const msg = String((e as { message?: string })?.message ?? '')
  if (msg.includes('items_not_checked')) return 'Confira todos os itens antes de marcar como pronto.'
  if (msg.includes('invalid_transition')) return 'Este pedido já mudou de situação. A tela foi atualizada.'
  if (msg.includes('out_of_stock') || msg.includes('insufficient')) return 'Falta estoque para separar este pedido. Confira o estoque e tente de novo.'
  if (msg.includes('forbidden') || msg.includes('not_allowed') || msg.includes('permission')) return 'Seu papel não permite esta ação.'
  return 'Não foi possível concluir. Nada foi alterado. Tente de novo.'
}
