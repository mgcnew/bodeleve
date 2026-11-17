// App do entregador. Hoje usa os mesmos stores da gestão; com o Supabase cada entregador entra
// por celular e código (Auth) e vê só as entregas que a regra de acesso (RLS) libera para ele.
import type { CourierAccount, CourierSession, DeliveryLogEntry } from '@/domain/courier'
import type { StaffOrder } from '@/domain/staffOrder'
import { createStore } from '@/lib/store'
import { supabase } from '@/lib/supabase'
import { courierAccounts, seedDeliveryLog } from '@/mocks/entregas'
import { remoteAccept, remoteConfirm, remoteDepart, remoteProblem, remoteSetAvailable, remoteSignInCourier, remoteSignOutCourier, remoteTake, remoteUndoProblem } from './entregasRemote'
import { newId } from './gestao/backoffice'
import { staffOrdersStore } from './gestao/orders'

// com o Supabase a sessão, a conta e o histórico vêm do banco (entregasRemote); sem ele, dados de exemplo
export const courierSessionStore = createStore<CourierSession | null>(supabase ? 'bodeleve.entregas.sessao.remoto' : 'bodeleve.entregas.sessao', () => null)
export const courierAccountStore = createStore<CourierAccount | null>('bodeleve.entregas.conta.remoto', () => null)
export const deliveryLogStore = createStore<DeliveryLogEntry[]>(supabase ? 'bodeleve.entregas.historico.remoto' : 'bodeleve.entregas.historico', () => (supabase ? [] : seedDeliveryLog()))

export const accountById = (id: string) => (supabase ? courierAccountStore.get() : (courierAccounts.find((c) => c.id === id) ?? null))

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

/** Com o Supabase, entra por e-mail e senha enquanto o código por celular (P8) não existe */
export const signInCourierWithPassword = (email: string, password: string) => remoteSignInCourier(email, password)

export function signOutCourier() {
  courierSessionStore.set(null)
  if (supabase) void remoteSignOutCourier()
}

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
export async function claim(id: string, c: CourierAccount) {
  if (supabase) return remoteTake(id)
  patch(id, { courierName: c.name, deliveryNote: 'pego pelo entregador' })
}

export async function accept(id: string) {
  if (supabase) return remoteAccept(id)
  patch(id, { courierStage: 'accepted', deliveryNote: 'aceito' })
}

/** Coleta conferida: sai da loja e o pedido passa a "em rota" */
export async function leaveStore(id: string) {
  if (supabase) return remoteDepart(id)
  patch(id, { status: 'en_route', courierStage: 'collected', deliveryNote: undefined })
}

/** H-E5 — entrega confirmada com o código de 4 números da cliente */
export async function confirmDelivery(id: string, code: string, c: CourierAccount): Promise<boolean> {
  if (supabase) return remoteConfirm(id, code.trim())
  const o = staffOrdersStore.get().find((x) => x.id === id)
  if (!o || o.deliveryCode !== code.trim()) return false
  patch(id, { status: 'delivered', courierStage: undefined })
  deliveryLogStore.set((l) => [{ id: newId('dl'), courierId: c.id, orderNumber: o.number, place: o.address?.line2 ?? '', at: new Date().toISOString(), km: o.distanceKm ?? null, result: 'delivered' }, ...l])
  return true
}

/** Devolve à loja: o pedido volta a "pronto" para a loja decidir se reenvia */
export type ReturnToken = { remote: true } | { before: Pick<StaffOrder, 'status' | 'courierName' | 'courierStage' | 'deliveryNote'>; logId: string }

export async function returnToStore(id: string, c: CourierAccount, reason: string): Promise<ReturnToken | null> {
  if (supabase) {
    await remoteProblem(id, reason, '')
    return { remote: true }
  }
  const o = staffOrdersStore.get().find((x) => x.id === id)
  if (!o) return null
  const before = { status: o.status, courierName: o.courierName, courierStage: o.courierStage, deliveryNote: o.deliveryNote }
  patch(id, { status: 'ready', courierName: null, courierStage: undefined, deliveryNote: `devolvido por ${c.name}: ${reason.toLowerCase()}` })
  const log: DeliveryLogEntry = { id: newId('dl'), courierId: c.id, orderNumber: o.number, place: o.address?.line2 ?? '', at: new Date().toISOString(), km: o.distanceKm ?? null, result: 'returned' }
  deliveryLogStore.set((l) => [log, ...l])
  return { before, logId: log.id }
}

export async function undoReturn(id: string, undo: ReturnToken) {
  if ('remote' in undo) return remoteUndoProblem(id)
  patch(id, undo.before)
  deliveryLogStore.set((l) => l.filter((x) => x.id !== undo.logId))
}

export async function setAvailable(available: boolean) {
  if (supabase) return remoteSetAvailable(available)
  courierSessionStore.set((s) => (s ? { ...s, available } : s))
}
