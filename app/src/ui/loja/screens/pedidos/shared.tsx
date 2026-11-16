import type { Tone } from '@/components/Badges'
import type { Order, OrderStatus } from '@/domain/order'

export const statusTag: Record<OrderStatus, { label: string; tone: Tone }> = {
  received: { label: 'Recebido', tone: 'info' },
  preparing: { label: 'Em preparo', tone: 'warning' },
  out_for_delivery: { label: 'Saiu para entrega', tone: 'info' },
  ready_for_pickup: { label: 'Pronto para retirar', tone: 'success' },
  delivered: { label: 'Entregue', tone: 'success' },
  picked_up: { label: 'Retirado', tone: 'success' },
  cancelled: { label: 'Cancelado', tone: 'error' },
}

export function etaText(order: Order) {
  if (order.status === 'ready_for_pickup') return 'Seu pedido está pronto para retirar.'
  if (order.status === 'out_for_delivery') return 'Seu pedido saiu para entrega.'
  if (order.status === 'preparing') return 'A casa está separando seus itens.'
  return 'A casa recebeu seu pedido.'
}
