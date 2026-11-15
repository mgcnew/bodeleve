import type { Order } from './types'

export type FlowAction = 'accept' | 'mark_ready' | 'undo_ready'

export class FlowError extends Error {
  constructor(public code: 'invalid_transition' | 'items_not_checked') {
    super(code)
  }
}

/**
 * Passos que a Gestão dá no pedido (H-G4): Novo → Em preparo (separando) → Pronto. Devolve o pedido novo; não altera o original.
 * "Em rota" e "Entregue" vêm da entrega (Etapa 6), não daqui.
 */
export function transition(order: Order, action: FlowAction, at: string, ctx: { checkedProductIds?: string[] } = {}): Order {
  switch (action) {
    case 'accept':
      if (order.status !== 'received') throw new FlowError('invalid_transition')
      return { ...order, status: 'preparing', stepTimes: { ...order.stepTimes, preparing: at } }
    case 'mark_ready': {
      if (order.status !== 'preparing') throw new FlowError('invalid_transition')
      const checked = new Set(ctx.checkedProductIds ?? [])
      if (!order.items.every((i) => checked.has(i.productId))) throw new FlowError('items_not_checked')
      const ready = order.fulfillment === 'delivery' ? 'ready_for_delivery' : 'ready_for_pickup'
      return { ...order, status: ready, stepTimes: { ...order.stepTimes, [ready]: at } }
    }
    case 'undo_ready':
      if (order.status !== 'ready_for_delivery' && order.status !== 'ready_for_pickup') throw new FlowError('invalid_transition')
      return { ...order, status: 'preparing' }
  }
}
