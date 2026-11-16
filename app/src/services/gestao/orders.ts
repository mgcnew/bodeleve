// Pedidos na gestão. Hoje um store no aparelho; com o Supabase vira `orders` com Realtime
// para pedidos novos aparecerem na hora (DATA_MODEL_DRAFT.md).
import type { StaffOrder, StaffOrderStatus } from '@/domain/staffOrder'
import { createStore } from '@/lib/store'
import { seedStaffOrders } from '@/mocks/gestao/orders'

export const staffOrdersStore = createStore<StaffOrder[]>('bodeleve.gestao.pedidos', seedStaffOrders)

function patch(id: string, fn: (o: StaffOrder) => StaffOrder) {
  staffOrdersStore.set((all) => all.map((o) => (o.id === id ? fn(o) : o)))
}

export function setStatus(id: string, status: StaffOrderStatus) {
  patch(id, (o) => ({ ...o, status }))
}

export function toggleChecked(id: string, index: number) {
  patch(id, (o) => ({ ...o, checked: o.checked.map((c, i) => (i === index ? !c : c)) }))
}

export function assignCourier(id: string, courierName: string) {
  patch(id, (o) => ({ ...o, courierName, status: 'en_route' }))
}
