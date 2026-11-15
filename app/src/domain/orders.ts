import type { Fulfillment, Order, OrderStatus } from './types'

export type TimelineEntry = { key: OrderStatus; label: string; detail?: string; state: 'done' | 'current' | 'future' }

const deliverySteps: Array<{ key: OrderStatus; label: string }> = [
  { key: 'received', label: 'Pedido recebido' },
  { key: 'preparing', label: 'Em preparo' },
  { key: 'out_for_delivery', label: 'Saiu para entrega' },
  { key: 'delivered', label: 'Entregue' },
]
const pickupSteps: Array<{ key: OrderStatus; label: string }> = [
  { key: 'received', label: 'Pedido recebido' },
  { key: 'preparing', label: 'Em preparo' },
  { key: 'ready_for_pickup', label: 'Pronto para retirada' },
  { key: 'picked_up', label: 'Retirado' },
]

export const stepsFor = (f: Fulfillment) => (f === 'delivery' ? deliverySteps : pickupSteps)

/**
 * A etapa atual é a do status do pedido; as anteriores estão concluídas. Pedido concluído não tem etapa atual.
 * Exceção dos quadros: logo após confirmar (status "recebido"), "Pedido recebido" já está feito e a casa está em "Em preparo".
 */
export function buildTimeline(order: Order): TimelineEntry[] {
  const steps = stepsFor(order.fulfillment)
  const statusIdx = steps.findIndex((s) => s.key === order.status)
  // "Pronto, aguardando entregador" ainda é a etapa "Em preparo" para o cliente.
  const idx = order.status === 'received' || order.status === 'ready_for_delivery' ? 1 : statusIdx
  const finished = idx === steps.length - 1
  return steps.map((s, i) => {
    const state: TimelineEntry['state'] = i < idx || (finished && i === idx) ? 'done' : i === idx ? 'current' : 'future'
    let detail = order.stepTimes[s.key]
    if (s.key === 'preparing' && state === 'current' && !detail) {
      detail = order.status === 'ready_for_delivery' ? 'Pronto. Aguardando o entregador' : 'A casa está separando seus itens'
    }
    if (s.key === 'out_for_delivery' && order.courierName && state !== 'future') {
      detail = `${detail ?? ''}${detail ? ' · ' : ''}com ${order.courierName}, entregador da casa`
    }
    return { key: s.key, label: s.label, detail, state }
  })
}

export const isInProgress = (o: Order) => !['delivered', 'picked_up', 'cancelled'].includes(o.status)

/** Situação como a Gestão a vê (filtros da lista de pedidos). */
export type OpenStage = 'new' | 'preparing' | 'ready' | 'on_route'
export function stageOf(o: Order): OpenStage | null {
  switch (o.status) {
    case 'received': return 'new'
    case 'preparing': return 'preparing'
    case 'ready_for_delivery':
    case 'ready_for_pickup': return 'ready'
    case 'out_for_delivery': return 'on_route'
    default: return null
  }
}

export const statusLabel: Record<OrderStatus, string> = {
  received: 'Recebido',
  preparing: 'Em preparo',
  out_for_delivery: 'Saiu para entrega',
  delivered: 'Entregue',
  ready_for_delivery: 'Pronto, aguardando entregador',
  ready_for_pickup: 'Pronto para retirada',
  picked_up: 'Retirado',
  cancelled: 'Cancelado',
}

export const statusTone = (s: OrderStatus): 'info' | 'warning' | 'success' | 'error' =>
  s === 'delivered' || s === 'picked_up' || s === 'ready_for_pickup' || s === 'ready_for_delivery' ? 'success' : s === 'cancelled' ? 'error' : s === 'preparing' ? 'warning' : 'info'
