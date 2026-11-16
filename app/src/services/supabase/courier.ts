import { DeliveryError, type Courier, type DeliveryRecord } from '@/domain/deliveries'
import { historyOf } from '@/domain/courierApp'
import { emptyHouse } from '@/domain/settings'
import type { Order } from '@/domain/types'
import { createAdminServices } from '@/mocks/adminServices'
import { createDb as createMemoryDb } from '@/mocks/db'
import type { CourierService } from '@/services/types'
import { ServiceError, unwrap, type Db } from './client'

/**
 * App de Entregas sobre o Supabase. Quem entrega nunca lê pedidos por tabela: tudo vem das funções `courier_*`, que só devolvem as entregas dele
 * (ou as livres para pegar) e nunca o código de confirmação. As telas montam o que mostram com as mesmas regras do app: o que chega do banco vira
 * um pedido e uma entrega em memória, e a visão simulada faz o resto.
 */

type Card = {
  order_id: string; number: string; state: string; district: string; street: string
  address: { street: string; number: string; complement: string; district: string; reference: string }
  items: number; total_cents: number; payment_method: Order['payment']['method'] | null; payment_paid: boolean; change_for_cents: number | null; ready_at: string | null
  fee_cents: number | null; at: string | null; expected_at: string | null; return_at: string | null; problem_reason: string | null
  customer?: string; phone?: string; store_address?: string; mine?: boolean
}
type Profile = { id: string; establishment_id: string; name: string; kind: Courier['kind']; phone: string; vehicle: string; available: boolean; pix_key: string }

const clock = (s: string) => s.replace(/(\d{1,2}):(\d{2})/g, '$1h$2')
const toCourier = (p: Profile): Courier => ({ id: p.id, name: p.name, kind: p.kind, phone: p.phone, vehicle: p.vehicle, available: p.available, pixKey: p.pix_key })

/** Celular com DDD → formato internacional que o Auth espera. */
export const e164 = (phone: string) => `+55${phone.replace(/\D/g, '').replace(/^0+/, '').replace(/^55(?=\d{10,11}$)/, '')}`

const smsEnabled: boolean = import.meta.env.VITE_COURIER_SMS === '1'

export function createSupabaseCourier(client: Db): CourierService {
  const memory = createMemoryDb({ storage: null, withSeed: false, now: () => new Date() })
  const view = createAdminServices({ db: memory, now: () => new Date() }).courier
  const ids = new Map<string, string>()
  let storeAddress = ''

  const rpc = async <T>(fn: string, args: Record<string, unknown> = {}): Promise<T> => unwrap(await client.rpc(fn as never, args as never)) as T

  const asDelivery = (e: unknown): never => {
    if (!(e instanceof ServiceError)) throw e
    const known = ['not_found', 'not_ready', 'already_assigned', 'no_assignment', 'wrong_state', 'wrong_code', 'not_yours', 'unavailable'] as const
    throw new DeliveryError((known as readonly string[]).includes(e.code) ? (e.code as (typeof known)[number]) : e.code === 'unknown_phone' ? 'not_found' : 'wrong_state')
  }

  const profile = async (): Promise<Courier> => toCourier(await rpc<Profile>('courier_link'))

  const orderOf = (c: Card): Order => ({
    id: c.number, channel: 'online', createdAt: c.at ?? new Date().toISOString(),
    status: c.state === 'en_route' ? 'out_for_delivery' : c.state === 'delivered' ? 'delivered' : 'ready_for_delivery', fulfillment: 'delivery',
    items: [{ productId: 'itens', name: 'Itens', unit: '', unitPriceCents: 0, qty: c.items }], subtotalCents: 0, deliveryFeeCents: 0, totalCents: Number(c.total_cents),
    contact: { name: c.customer ?? '', phone: c.phone ?? '' },
    address: { cep: '', street: c.address.street, number: c.address.number, complement: c.address.complement, district: c.address.district, reference: c.address.reference },
    window: { id: 'asap', label: '', detail: '' },
    payment: { method: c.payment_method ?? 'pix', changeForCents: c.change_for_cents == null ? null : Number(c.change_for_cents), paid: c.payment_paid },
    // O código de entrega nunca chega aqui.
    deliveryCode: '', etaLabel: null, courierName: null, stepTimes: c.ready_at ? { ready_for_delivery: clock(c.ready_at) } : {},
  })

  const recordOf = (c: Card, courier: Courier, mine: boolean): DeliveryRecord | null => {
    if (c.state === 'free') return null
    return {
      orderId: c.number, customer: c.customer ?? '', district: c.district, courierId: mine ? courier.id : null, courierName: mine ? courier.name : 'Parceiros',
      kind: mine ? courier.kind : 'partner', status: c.state as DeliveryRecord['status'], feeCents: c.fee_cents == null ? null : Number(c.fee_cents),
      at: c.at ?? new Date().toISOString(), expectedAt: c.expected_at, returnAt: c.return_at, items: c.items,
      problem: c.problem_reason ? { reason: c.problem_reason, note: '', prev: { at: c.at ?? '', expectedAt: c.expected_at, returnAt: c.return_at } } : null,
    }
  }

  /** Coloca na memória o que o banco mostrou a esta pessoa e devolve o cadastro dela. */
  const load = (courier: Courier, mine: Card[], available: Card[]) => {
    for (const c of [...mine, ...available]) ids.set(c.number, c.order_id)
    memory.update((s) => {
      s.couriers = [courier]
      s.orders = [...mine, ...available].map(orderOf)
      s.deliveries = [...mine.map((c) => recordOf(c, courier, true)), ...available.map((c) => recordOf(c, courier, false))].filter((r): r is DeliveryRecord => r !== null)
      s.house = { ...emptyHouse, address: storeAddress }
    })
  }

  const snapshot = async () => {
    const courier = await profile()
    const list = await rpc<{ available: Card[]; mine: Card[] }>('courier_list')
    load(courier, list.mine, list.available)
    return courier
  }

  const uuidOf = async (number: string): Promise<string> => {
    if (!ids.has(number)) await snapshot()
    const id = ids.get(number)
    if (!id) throw new DeliveryError('not_found')
    return id
  }

  /** A entrega como ela está agora no banco (inclusive já entregue ou devolvida), para a tela da etapa. */
  const detail = async (number: string) => {
    const courier = await profile()
    const card = await rpc<Card | null>('courier_detail', { p_order: await uuidOf(number) })
    if (!card) return null
    if (card.store_address) storeAddress = card.store_address
    load(courier, card.mine ? [card] : [], card.mine ? [] : [card])
    return view.get(courier.id, number)
  }

  const act = async (fn: string, number: string, extra: Record<string, unknown> = {}) => {
    try {
      await rpc(fn, { p_order: await uuidOf(number), ...extra })
    } catch (e) {
      return asDelivery(e)
    }
    return (await detail(number))!
  }

  return {
    codeLength: 6,
    async requestCode(phone) {
      // D21: o código é uma mensagem real; só liga quando a casa aprovar o envio e configurar o provedor (VITE_COURIER_SMS=1).
      if (!smsEnabled) throw new Error('sms_disabled')
      const { error } = await client.auth.signInWithOtp({ phone: e164(phone) })
      if (error) throw new DeliveryError('not_found')
    },
    async verify(phone, code) {
      const { error } = await client.auth.verifyOtp({ phone: e164(phone), token: code, type: 'sms' })
      if (error) throw new Error('invalid_code')
      try {
        return await profile()
      } catch (e) {
        await client.auth.signOut()
        return asDelivery(e)
      }
    },
    async profile() {
      try {
        return await profile()
      } catch {
        return null
      }
    },
    async setAvailable(_id, available) {
      await rpc('courier_set_available', { p_available: available })
      return profile()
    },
    async savePix(_id, key) {
      await rpc('courier_save_pix', { p_key: key })
      return profile()
    },
    async list() {
      const courier = await snapshot()
      return view.list(courier.id)
    },
    async get(_id, orderId) {
      try {
        return await detail(orderId)
      } catch (e) {
        if (e instanceof DeliveryError) return null
        throw e
      }
    },
    take: (_id, orderId) => act('courier_take', orderId),
    accept: (_id, orderId) => act('courier_accept', orderId),
    depart: (_id, orderId) => act('courier_depart', orderId),
    confirm: (_id, orderId, code) => act('courier_confirm', orderId, { p_code: code }),
    problem: (_id, orderId, reason, note) => act('courier_problem', orderId, { p_reason: reason, p_note: note }),
    undoProblem: (_id, orderId) => act('courier_undo_problem', orderId),
    async history() {
      const courier = await profile()
      const h = await rpc<{ rows: Array<{ number: string; district: string; at: string; status: 'delivered' | 'returned'; fee_cents: number | null }> }>('courier_history')
      const records: DeliveryRecord[] = h.rows.map((r) => ({
        orderId: r.number, customer: '', district: r.district, courierId: courier.id, courierName: courier.name, kind: courier.kind, status: r.status,
        feeCents: r.fee_cents == null ? null : Number(r.fee_cents), at: r.at, expectedAt: null, returnAt: null,
      }))
      return { ...historyOf(courier, records, new Date()), courierName: courier.name }
    },
  }
}

