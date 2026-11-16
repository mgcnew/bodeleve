import type { DeliveryRecord } from '@/domain/deliveries'

/** Entregas de EXEMPLO (quadros Entregas e Atribuir). Os horários são relativos a hoje. */
export function buildDeliverySeed(now: Date): DeliveryRecord[] {
  const min = (m: number) => new Date(now.getTime() + m * 60_000).toISOString()
  const today = (h: number, m: number) => {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m)
    return (d > now ? new Date(now.getTime() - 30 * 60_000) : d).toISOString()
  }
  return [
    // 1042 (pedido da fila): saiu há 18 min com o Carlos, previsão em 10 min e volta 10 min depois.
    { orderId: '1042', customer: 'Ana Souza', district: 'Jardim das Flores', courierId: 'carlos', courierName: 'Carlos', kind: 'own', status: 'en_route', feeCents: null, at: min(-18), expectedAt: min(10), returnAt: min(20) },
    // Entregues do dia (históricos: os pedidos já saíram da fila).
    { orderId: '1038', customer: 'Rafael Dias', district: 'Centro', courierId: 'bruno', courierName: 'Bruno', kind: 'own', status: 'delivered', feeCents: null, at: today(13, 5), expectedAt: null, returnAt: null },
    { orderId: '1036', customer: 'Paula Reis', district: 'Bairro Alto', courierId: null, courierName: 'Parceiros', kind: 'partner', status: 'delivered', feeCents: 900, at: today(11, 48), expectedAt: null, returnAt: null },
  ]
}
