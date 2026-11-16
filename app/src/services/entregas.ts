// App do entregador. Hoje usa os mesmos stores da gestão; com o Supabase cada entregador entra
// por celular e código (Auth) e vê só as entregas que a regra de acesso (RLS) libera para ele.
import type { CourierAccount, CourierSession, DeliveryLogEntry } from '@/domain/courier'
import type { StaffOrder } from '@/domain/staffOrder'
import { createStore } from '@/lib/store'
import { courierAccounts, seedDeliveryLog } from '@/mocks/entregas'
import { newId } from './gestao/backoffice'
import { staffOrdersStore } from './gestao/orders'

export const courierSessionStore = createStore<CourierSession | null>('bodeleve.entregas.sessao', () => null)
export const deliveryLogStore = createStore<DeliveryLogEntry[]>('bodeleve.entregas.historico', seedDeliveryLog)

export const accountById = (id: string) => courierAccounts.find((c) => c.id === id) ?? null

const digits = (s: string) => s.replace(/\D/g, '')

/** O celular precisa estar entre os cadastrados pela casa */
export function findCourierByPhone(phone: string): CourierAccount | null {
  return courierAccounts.find((c) => digits(c.phone) === digits(phone)) ?? null
}

/**
 * H-E1 — código de 4 números enviado pelo WhatsApp. O envio depende do provedor de mensagens (P8);
 * até lá qualquer código de 4 números entra, só para o fluxo ficar completo.
 */
export function signInCourier(phone: string, code: string): CourierAccount {
  const c = findCourierByPhone(phone)
  if (!c) throw new Error('celular não cadastrado')
  if (!/^\d{4}$/.test(code)) throw new Error('código inválido')
  courierSessionStore.set({ courierId: c.id, available: true })
  return c
}

export const signOutCourier = () => courierSessionStore.set(null)

const delivery = (orders: StaffOrder[]) => orders.filter((o) => o.fulfillment === 'delivery')

/** H-E2 — da casa: atribuídas e as livres; parceiro: só as publicadas */
export function availableFor(c: CourierAccount, orders: StaffOrder[]) {
  return delivery(orders).filter((o) => o.status === 'ready' && !o.courierName && (c.kind === 'own' || !!o.deliveryNote?.includes('publicado')))
}

export function mineFor(c: CourierAccount, orders: StaffOrder[]) {
  return delivery(orders).filter((o) => o.courierName === c.name && (o.status === 'ready' || o.status === 'en_route'))
}

function patch(id: string, p: Partial<StaffOrder>) {
  staffOrdersStore.set((all) => all.map((o) => (o.id === id ? { ...o, ...p } : o)))
}

/** Pegar uma entrega livre: fica na fila do entregador */
export const claim = (id: string, c: CourierAccount) => patch(id, { courierName: c.name, deliveryNote: 'pego pelo entregador' })

export const accept = (id: string) => patch(id, { courierStage: 'accepted', deliveryNote: 'aceito' })

/** Coleta conferida: sai da loja e o pedido passa a "em rota" */
export const leaveStore = (id: string) => patch(id, { status: 'en_route', courierStage: 'collected', deliveryNote: undefined })

/** H-E5 — entrega confirmada com o código de 4 números da cliente */
export function confirmDelivery(id: string, code: string, c: CourierAccount) {
  const o = staffOrdersStore.get().find((x) => x.id === id)
  if (!o || o.deliveryCode !== code.trim()) return false
  patch(id, { status: 'delivered', courierStage: undefined })
  deliveryLogStore.set((l) => [{ id: newId('dl'), courierId: c.id, orderNumber: o.number, place: o.address?.line2 ?? '', at: new Date().toISOString(), km: o.distanceKm ?? null, result: 'delivered' }, ...l])
  return true
}

/** Devolve à loja: o pedido volta a "pronto" para a loja decidir se reenvia */
export function returnToStore(id: string, c: CourierAccount, reason: string) {
  const o = staffOrdersStore.get().find((x) => x.id === id)
  if (!o) return null
  const before = { status: o.status, courierName: o.courierName, courierStage: o.courierStage, deliveryNote: o.deliveryNote }
  patch(id, { status: 'ready', courierName: null, courierStage: undefined, deliveryNote: `devolvido por ${c.name}: ${reason.toLowerCase()}` })
  const log: DeliveryLogEntry = { id: newId('dl'), courierId: c.id, orderNumber: o.number, place: o.address?.line2 ?? '', at: new Date().toISOString(), km: o.distanceKm ?? null, result: 'returned' }
  deliveryLogStore.set((l) => [log, ...l])
  return { before, logId: log.id }
}

export function undoReturn(id: string, undo: NonNullable<ReturnType<typeof returnToStore>>) {
  patch(id, undo.before)
  deliveryLogStore.set((l) => l.filter((x) => x.id !== undo.logId))
}

export function setAvailable(available: boolean) {
  courierSessionStore.set((s) => (s ? { ...s, available } : s))
}
