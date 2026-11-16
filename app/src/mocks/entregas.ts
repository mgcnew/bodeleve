// Entregadores cadastrados e histórico de exemplo (design/Ent-*.dc.html)
import type { CourierAccount, DeliveryLogEntry } from '@/domain/courier'
import { minutesBefore } from '@/domain/dates'

// H-E1 — só entra quem a casa cadastrou: entregadores próprios e parceiros
export const courierAccounts: CourierAccount[] = [
  { id: 'bruno', name: 'Bruno', kind: 'own', phone: '(00) 90000-0300', vehicle: 'Moto · [PLACA]' },
  { id: 'carlos', name: 'Carlos', kind: 'own', phone: '(00) 90000-0310', vehicle: 'Moto · [PLACA]' },
  { id: 'diego', name: 'Diego', kind: 'partner', phone: '(00) 90000-0301', vehicle: 'Moto · [PLACA]' },
]

export const seedDeliveryLog = (): DeliveryLogEntry[] => [
  { id: 'dl-1', courierId: 'bruno', orderNumber: '1038', place: 'Vila Nova', at: minutesBefore(150), km: 2.6, result: 'delivered' },
  { id: 'dl-2', courierId: 'bruno', orderNumber: '1035', place: 'Centro', at: minutesBefore(240), km: 1.2, result: 'delivered' },
  { id: 'dl-3', courierId: 'bruno', orderNumber: '1031', place: 'Jardim das Flores', at: minutesBefore(330), km: 3.3, result: 'returned' },
  { id: 'dl-4', courierId: 'diego', orderNumber: '1036', place: 'Bairro Alto', at: minutesBefore(420), km: 4.1, result: 'delivered' },
]
