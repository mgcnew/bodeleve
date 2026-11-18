// App do entregador no banco. O entregador entra pelo Supabase Auth e o celular da conta é vinculado ao
// cadastro da casa (`courier_link`). As telas continuam lendo `staffOrdersStore` (entregas livres e minhas,
// já no formato de pedido) e `deliveryLogStore`; aqui eles são alimentados por `courier_list` e
// `courier_history`, e cada ação chama `courier_take`, `courier_accept`, `courier_depart`, `courier_confirm`,
// `courier_problem` e `courier_undo_problem`. O entregador só enxerga o que essas funções liberam.
import { markLoaded } from '@/services/firstLoad'
import type { CourierAccount, DeliveryLogEntry } from '@/domain/courier'
import type { StaffOrder } from '@/domain/staffOrder'
import { supabase } from '@/lib/supabase'
import { staffOrdersStore } from './gestao/orders'
import { courierAccountStore, courierSessionStore, deliveryLogStore } from './entregas'

type Card = {
  order_id: string
  number: string
  state: 'free' | 'published' | 'reserved' | 'assigned' | 'accepted' | 'en_route' | 'delivered' | 'returned'
  district: string
  address: { street?: string; number?: string; complement?: string; district?: string; reference?: string }
  items: number
  total_cents: number
  payment_method: string
  payment_paid: boolean
  ready_at: string | null
  fee_cents: number | null
  at: string | null
  customer?: string
  phone?: string
}

type CourierRow = { id: string; name: string; kind: 'own' | 'partner'; phone: string; vehicle: string | null; available: boolean; pix_key: string | null }

const paymentLabels: Record<string, string> = { pix: 'Pix', card_on_delivery: 'Cartão na entrega', cash: 'Dinheiro na entrega', on_pickup: 'Pagar na retirada', on_account: 'A prazo', debit: 'Débito', credit: 'Crédito' }

/** "14:35" (hora do passo "pronto") vira hoje às 14h35; sem hora, agora */
function readyIso(readyAt: string | null, fallback: string | null) {
  const m = /^(\d{2}):(\d{2})/.exec(readyAt ?? '')
  if (!m) return fallback ?? new Date().toISOString()
  const d = new Date()
  d.setHours(Number(m[1]), Number(m[2]), 0, 0)
  return d.toISOString()
}

function toOrder(c: Card, account: CourierAccount, mine: boolean): StaffOrder {
  const a = c.address
  const count = Math.max(1, c.items)
  const unit = Math.round(c.total_cents / count)
  return {
    id: c.order_id,
    number: c.number,
    createdAt: readyIso(c.ready_at, c.at),
    status: c.state === 'en_route' ? 'en_route' : c.state === 'delivered' ? 'delivered' : 'ready',
    customer: { id: c.order_id, name: c.customer ?? '', phone: c.phone ?? '', since: c.at ?? new Date().toISOString(), orderCount: 1 },
    fulfillment: 'delivery',
    address: { line1: [`${a.street ?? ''}, ${a.number ?? ''}`, a.complement].filter(Boolean).join(' · '), line2: a.district ?? c.district },
    windowLabel: '',
    // o entregador só precisa da quantidade e do total: um item resumido que fecha com o total do pedido
    items: [{ productId: 'itens', name: 'Itens do pedido', qtyLabel: `${count} un`, quantity: count, unitPriceCents: unit, lot: null, lotExpiry: null }],
    checked: [true],
    feeCents: c.total_cents - unit * count,
    paymentLabel: paymentLabels[c.payment_method] ?? c.payment_method,
    paid: c.payment_paid,
    courierName: mine ? account.name : null,
    deliveryCode: '',
    courierStage: c.state === 'accepted' ? 'accepted' : c.state === 'en_route' ? 'collected' : undefined,
    // para parceiro só chegam as publicadas; a lista "disponíveis" filtra por esta marca
    deliveryNote: !mine ? 'publicado para parceiros' : undefined,
  }
}

const toAccount = (r: CourierRow): CourierAccount => ({ id: r.id, name: r.name, kind: r.kind, phone: r.phone, vehicle: r.vehicle ?? '' })

let loading: Promise<void> | null = null
let rerun: Promise<void> | null = null

/** Busca as entregas livres e minhas, o histórico do dia e a disponibilidade */
export async function refreshCourier(): Promise<void> {
  if (!supabase || !courierSessionStore.get()) return
  if (loading) {
    rerun ??= loading.catch(() => undefined).then(() => {
      rerun = null
      return refreshCourier()
    })
    return rerun
  }
  loading = (async () => {
    const [link, list, hist] = await Promise.all([supabase!.rpc('courier_link'), supabase!.rpc('courier_list'), supabase!.rpc('courier_history')])
    if (link.error || list.error) {
      // sem vínculo ou sessão vencida: sai
      courierSessionStore.set(null)
      return
    }
    const row = link.data as CourierRow
    const account = toAccount(row)
    courierAccountStore.set(account)
    courierSessionStore.set((s) => (s ? { ...s, courierId: account.id, available: row.available } : s))
    const data = list.data as { available: Card[]; mine: Card[] }
    staffOrdersStore.set([...data.mine.map((c) => toOrder(c, account, true)), ...data.available.map((c) => toOrder(c, account, false))])
    const h = hist.data as { rows: { order_id: string; number: string; district: string; at: string; status: 'delivered' | 'returned' }[] } | null
    if (h) {
      deliveryLogStore.set(h.rows.map((r): DeliveryLogEntry => ({ id: r.order_id, courierId: account.id, orderNumber: r.number, place: r.district, at: r.at, km: null, result: r.status })))
    }
  })().finally(() => {
    loading = null
    markLoaded('courier')
  })
  return loading
}

export function startCourierSync() {
  if (!supabase) return () => undefined
  void refreshCourier()
  const timer = setInterval(() => void refreshCourier(), 10_000)
  return () => clearInterval(timer)
}

export async function remoteSignInCourier(email: string, password: string) {
  const { data, error } = await supabase!.auth.signInWithPassword({ email, password })
  if (error || !data.user) throw new Error('credenciais')
  const link = await supabase!.rpc('courier_link')
  if (link.error) {
    await supabase!.auth.signOut()
    throw new Error('unknown_phone')
  }
  const row = link.data as CourierRow
  courierAccountStore.set(toAccount(row))
  courierSessionStore.set({ courierId: row.id, available: row.available })
  await refreshCourier()
}

export async function remoteSignOutCourier() {
  await supabase?.auth.signOut()
  courierAccountStore.set(null)
  staffOrdersStore.set([])
}

async function rpc(fn: string, args: Record<string, unknown>) {
  const { error } = await supabase!.rpc(fn, args)
  if (error) throw error
  await refreshCourier()
}

export const remoteTake = (orderId: string) => rpc('courier_take', { p_order: orderId })
export const remoteAccept = (orderId: string) => rpc('courier_accept', { p_order: orderId })
export const remoteDepart = (orderId: string) => rpc('courier_depart', { p_order: orderId })
export const remoteSetAvailable = (available: boolean) => rpc('courier_set_available', { p_available: available })
export const remoteSavePix = (key: string) => rpc('courier_save_pix', { p_key: key })
export const remoteProblem = (orderId: string, reason: string, note: string) => rpc('courier_problem', { p_order: orderId, p_reason: reason, p_note: note })
export const remoteUndoProblem = (orderId: string) => rpc('courier_undo_problem', { p_order: orderId })

/** `false` quando o código não confere; outros erros sobem */
export async function remoteConfirm(orderId: string, code: string) {
  const { error } = await supabase!.rpc('courier_confirm', { p_order: orderId, p_code: code })
  if (error) {
    if (String(error.message).includes('wrong_code')) return false
    throw error
  }
  await refreshCourier()
  return true
}

export function courierErrorMessage(e: unknown) {
  const msg = String((e as { message?: string })?.message ?? '')
  if (msg.includes('already_assigned') || msg.includes('not_found')) return 'Essa entrega já foi pega por outra pessoa. A lista foi atualizada.'
  if (msg.includes('unavailable')) return 'Você está indisponível. Ligue “Disponível” no perfil para pegar entregas.'
  if (msg.includes('wrong_state')) return 'A entrega já mudou de etapa. A lista foi atualizada.'
  if (msg.includes('invalid_reason')) return 'Escolha o motivo do problema.'
  if (msg.includes('forbidden')) return 'Seu cadastro de entregador não permite esta ação.'
  return 'Não foi possível concluir. Nada foi alterado. Tente de novo.'
}
