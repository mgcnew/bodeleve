import type { Cents } from './money'

export type CourierAccount = { id: string; name: string; kind: 'own' | 'partner'; phone: string; vehicle: string }

export type DeliveryLogEntry = {
  id: string
  courierId: string
  orderNumber: string
  place: string
  at: string
  km: number | null
  result: 'delivered' | 'returned'
}

export type CourierSession = { courierId: string; available: boolean }

/** H-E6 — devolução à loja paga metade ao parceiro */
export const partnerEarning = (r: DeliveryLogEntry['result'], fee: Cents, returnFee: Cents) => (r === 'delivered' ? fee : returnFee)
