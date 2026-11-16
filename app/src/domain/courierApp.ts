import { delivery as cfg } from '@/config/delivery'
import { DeliveryError, hhmm, isOpenRecord, kmValue, openRecordOf, type Courier, type DeliveryRecord } from './deliveries'
import type { Order } from './types'

/**
 * Regras do app do entregador: o que cada pessoa vê, e as etapas Aceite → Coleta → Em rota → Entrega (ou Problema).
 * Funções mudam o pedido e a entrega que recebem; quem chama grava depois. Nada é enviado a ninguém (D21).
 */

export const PROBLEM_REASONS = ['Cliente não atende', 'Endereço não encontrado', 'Cliente recusou o pedido', 'Cliente sem o código', 'Outro']

export const deliveryItems = (o: Order) => o.items.reduce((s, i) => s + i.qty, 0)

/** Quanto o entregador cobra na porta: nada se já foi pago. */
export const cashDue = (o: Order) => (o.payment.paid ? 0 : o.totalCents)

/** Quanto o parceiro recebe: o valor da entrega, ou metade se devolveu. Entregador da casa recebe por mês. */
export function payoutOf(r: Pick<DeliveryRecord, 'kind' | 'status' | 'feeCents'>): number | null {
  if (r.kind !== 'partner') return null
  if (r.status === 'returned') return cfg.partnerReturnFeeCents
  return r.feeCents ?? cfg.partnerFeeCents
}

const order = { en_route: 0, accepted: 1, assigned: 2, reserved: 3, published: 4, delivered: 5, returned: 6 } as const

export type Seen = { order: Order; record: DeliveryRecord | null }

/** Disponíveis: o que está livre (próprio) ou foi publicado (parceiro). Minhas: o que é dela ou dele e ainda não terminou. */
export function visibleTo(courier: Courier, orders: Order[], records: DeliveryRecord[]): { available: Seen[]; mine: Array<{ order: Order; record: DeliveryRecord }> } {
  const byId = new Map(orders.map((o) => [o.id, o]))
  const mine = records
    .filter((r) => isOpenRecord(r) && r.courierId === courier.id)
    .flatMap((r) => (byId.get(r.orderId) ? [{ order: byId.get(r.orderId)!, record: r }] : []))
    .sort((a, b) => order[a.record.status] - order[b.record.status])
  let available: Seen[] = []
  if (courier.available) {
    if (courier.kind === 'own') {
      const taken = new Set(records.filter(isOpenRecord).map((r) => r.orderId))
      available = orders.filter((o) => o.fulfillment === 'delivery' && o.status === 'ready_for_delivery' && !taken.has(o.id)).map((o) => ({ order: o, record: null }))
    } else {
      available = records.filter((r) => r.status === 'published' && r.courierId === null).flatMap((r) => (byId.get(r.orderId) ? [{ order: byId.get(r.orderId)!, record: r }] : []))
    }
  }
  return { available, mine }
}

/** "Pegar esta entrega" / "Aceitar por R$ 9,00" na lista: a entrega passa a ser dela ou dele (falta aceitar no detalhe). */
export function take(courier: Courier, o: Order, records: DeliveryRecord[], now: Date): DeliveryRecord {
  if (!courier.available) throw new DeliveryError('unavailable')
  const published = records.find((r) => r.orderId === o.id && r.status === 'published' && r.courierId === null)
  if (courier.kind === 'partner') {
    if (!published) throw new DeliveryError('not_found')
    published.courierId = courier.id
    published.courierName = courier.name
    published.status = 'assigned'
    published.at = now.toISOString()
    return published
  }
  if (openRecordOf(records, o.id) || o.status !== 'ready_for_delivery' || o.fulfillment !== 'delivery') throw new DeliveryError('already_assigned')
  const onRoute = records.some((r) => r.courierId === courier.id && r.status === 'en_route')
  const rec: DeliveryRecord = {
    orderId: o.id, customer: o.contact.name, district: o.address?.district ?? '', courierId: courier.id, courierName: courier.name, kind: 'own',
    status: onRoute ? 'reserved' : 'assigned', feeCents: null, at: now.toISOString(), expectedAt: null, returnAt: null, items: deliveryItems(o), problem: null,
  }
  records.push(rec)
  return rec
}

const mineOrThrow = (courier: Courier, r: DeliveryRecord | undefined): DeliveryRecord => {
  if (!r) throw new DeliveryError('not_found')
  if (r.courierId !== courier.id) throw new DeliveryError('not_yours')
  return r
}

export function accept(courier: Courier, r: DeliveryRecord | undefined, now: Date): DeliveryRecord {
  const rec = mineOrThrow(courier, r)
  if (rec.status !== 'assigned' && rec.status !== 'reserved') throw new DeliveryError('wrong_state')
  rec.status = 'accepted'
  rec.at = now.toISOString()
  return rec
}

/** "Saí da loja": a entrega vai para Em rota e o pedido para "saiu para entrega". Previsão = km × minutos por km. */
export function depart(courier: Courier, o: Order, r: DeliveryRecord | undefined, now: Date): DeliveryRecord {
  const rec = mineOrThrow(courier, r)
  if (rec.status !== 'accepted') throw new DeliveryError('wrong_state')
  const km = kmValue(rec.district)
  const eta = new Date(now.getTime() + (km ?? 3) * cfg.minutesPerKm * 60_000)
  rec.status = 'en_route'
  rec.at = now.toISOString()
  rec.expectedAt = eta.toISOString()
  rec.returnAt = new Date(eta.getTime() + 10 * 60_000).toISOString()
  o.status = 'out_for_delivery'
  o.stepTimes = { ...o.stepTimes, out_for_delivery: hhmm(now.toISOString()) }
  o.etaLabel = `Hoje, ${hhmm(eta.toISOString())}`
  o.courierName = courier.name
  return rec
}

/** O código de 4 números que quem comprou tem confere com o do pedido. */
export function confirm(courier: Courier, o: Order, r: DeliveryRecord | undefined, code: string, now: Date): DeliveryRecord {
  const rec = mineOrThrow(courier, r)
  if (rec.status !== 'en_route') throw new DeliveryError('wrong_state')
  if (code.trim() !== o.deliveryCode) throw new DeliveryError('wrong_code')
  rec.status = 'delivered'
  rec.at = now.toISOString()
  o.status = 'delivered'
  o.stepTimes = { ...o.stepTimes, delivered: hhmm(now.toISOString()) }
  o.etaLabel = null
  // Pagamento na entrega (dinheiro ou cartão): o que foi cobrado na porta passa a pago.
  if (!o.payment.paid) o.payment = { ...o.payment, paid: true }
  return rec
}

/** Devolução à loja: o pedido volta a "pronto" e a casa decide se reenvia. */
export function reportProblem(courier: Courier, o: Order, r: DeliveryRecord | undefined, reason: string, note: string, now: Date): DeliveryRecord {
  const rec = mineOrThrow(courier, r)
  if (rec.status !== 'en_route') throw new DeliveryError('wrong_state')
  rec.problem = { reason, note: note.trim(), prev: { at: rec.at, expectedAt: rec.expectedAt, returnAt: rec.returnAt } }
  rec.status = 'returned'
  rec.at = now.toISOString()
  o.status = 'ready_for_delivery'
  o.courierName = null
  o.etaLabel = null
  return rec
}

/** Desfaz a devolução (enquanto o pedido não foi atribuído de novo). */
export function undoProblem(courier: Courier, o: Order, r: DeliveryRecord | undefined, records: DeliveryRecord[]): DeliveryRecord {
  const rec = mineOrThrow(courier, r)
  if (rec.status !== 'returned' || !rec.problem) throw new DeliveryError('wrong_state')
  if (o.status !== 'ready_for_delivery' || openRecordOf(records, rec.orderId)) throw new DeliveryError('wrong_state')
  const prev = rec.problem.prev
  rec.status = 'en_route'
  rec.at = prev.at
  rec.expectedAt = prev.expectedAt
  rec.returnAt = prev.returnAt
  rec.problem = null
  o.status = 'out_for_delivery'
  o.courierName = courier.name
  o.etaLabel = prev.expectedAt ? `Hoje, ${hhmm(prev.expectedAt)}` : null
  return rec
}

const sameDay = (iso: string, t: Date) => {
  const d = new Date(iso)
  return d.getFullYear() === t.getFullYear() && d.getMonth() === t.getMonth() && d.getDate() === t.getDate()
}

export type HistoryRow = { orderId: string; district: string; at: string; km: number | null; status: 'delivered' | 'returned'; payoutCents: number | null }
export type History = { delivered: number; returned: number; km: number; rows: HistoryRow[]; payoutCents: number | null; payoutDetail: string | null }

/** Histórico de hoje de uma pessoa. Parceiro vê o que vai receber; entregador da casa, só para conferência. */
export function historyOf(courier: Courier, records: DeliveryRecord[], now: Date): History {
  const mine = records.filter((r) => r.courierId === courier.id && (r.status === 'delivered' || r.status === 'returned') && sameDay(r.at, now)).sort((a, b) => b.at.localeCompare(a.at))
  const rows: HistoryRow[] = mine.map((r) => ({ orderId: r.orderId, district: r.district, at: r.at, km: kmValue(r.district), status: r.status as 'delivered' | 'returned', payoutCents: payoutOf(r) }))
  const delivered = rows.filter((r) => r.status === 'delivered').length
  const returned = rows.length - delivered
  const partner = courier.kind === 'partner'
  const payout = partner ? rows.reduce((a, r) => a + (r.payoutCents ?? 0), 0) : null
  const money = (c: number) => `R$ ${(c / 100).toFixed(2).replace('.', ',')}`
  return {
    delivered,
    returned,
    km: Math.round(rows.reduce((a, r) => a + (r.km ?? 0), 0) * 10) / 10,
    rows,
    payoutCents: payout,
    payoutDetail: partner ? `${delivered} ${delivered === 1 ? 'entrega' : 'entregas'} × ${money(cfg.partnerFeeCents)} + ${returned} ${returned === 1 ? 'devolução' : 'devoluções'} × ${money(cfg.partnerReturnFeeCents)}. Pago por Pix toda segunda.` : null,
  }
}
