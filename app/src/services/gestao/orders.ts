// Pedidos na gestão. Hoje um store no aparelho; com o Supabase vira `orders` com Realtime
// para pedidos novos aparecerem na hora (DATA_MODEL_DRAFT.md).
import type { StaffOrder, StaffOrderStatus } from '@/domain/staffOrder'
import { createStore } from '@/lib/store'
import { supabase } from '@/lib/supabase'
import { seedStaffOrders } from '@/mocks/gestao/orders'

// com o Supabase ligado é um cache do banco (começa vazio); sem ele, dados de exemplo no aparelho
export const staffOrdersStore = supabase
  ? createStore<StaffOrder[]>('bodeleve.gestao.pedidos.remoto', () => [])
  : createStore<StaffOrder[]>('bodeleve.gestao.pedidos', seedStaffOrders)

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
