import { delivery as cfg } from '@/config/delivery'
import type { Order } from './types'

/** Painel de entregas da gestão e regras do app do entregador: o que sai, quem leva e o que já foi entregue. */

export type CourierKind = 'own' | 'partner'

/** Entregador cadastrado pela casa (próprio ou parceiro avulso). */
export type Courier = {
  id: string
  name: string
  kind: CourierKind
  phone: string
  vehicle: string
  /** "Disponível para entregas": desligado quando o turno acaba. */
  available: boolean
  /** Chave Pix de quem recebe por entrega (parceiro). */
  pixKey: string
}

export type DeliveryStatus = 'published' | 'reserved' | 'assigned' | 'accepted' | 'en_route' | 'delivered' | 'returned'

export type DeliveryProblem = {
  reason: string
  note: string
  /** O que a entrega era antes do problema, para desfazer. */
  prev: { at: string; expectedAt: string | null; returnAt: string | null }
}

export type DeliveryRecord = {
  orderId: string
  customer: string
  district: string
  /** `null` = publicada para parceiros avulsos, ainda sem quem aceitou. */
  courierId: string | null
  courierName: string
  kind: CourierKind
  status: DeliveryStatus
  /** Valor pago ao parceiro por esta entrega. */
  feeCents: number | null
  /** Quando entrou neste status. */
  at: string
  expectedAt: string | null
  returnAt: string | null
  /** Itens do pedido, para o histórico. */
  items?: number
  problem?: DeliveryProblem | null
}

export class DeliveryError extends Error {
  constructor(public code: 'not_found' | 'not_ready' | 'already_assigned' | 'no_assignment' | 'wrong_state' | 'wrong_code' | 'not_yours' | 'unavailable') {
    super(code)
  }
}

export const hhmm = (iso: string) => {
  const d = new Date(iso)
  return `${String(d.getHours()).padStart(2, '0')}h${String(d.getMinutes()).padStart(2, '0')}`
}

export const kmValue = (district: string): number | null => cfg.districtKm[district] ?? null
export const kmLabel = (district: string) => {
  const km = kmValue(district)
  return km == null ? null : `${km.toFixed(1).replace('.', ',')} km`
}

/** Entrega ainda em andamento (a devolvida e a entregue estão encerradas). */
export const isOpenRecord = (r: DeliveryRecord) => r.status !== 'delivered' && r.status !== 'returned'
export const openRecordOf = (records: DeliveryRecord[], orderId: string) => records.find((r) => r.orderId === orderId && isOpenRecord(r))

export type Tab = 'out' | 'route' | 'done'
export type DispatchRow = {
  orderId: string
  customer: string
  label: string
  tone: 'info' | 'success' | 'warning' | 'neutral'
  detail: string
  tab: Tab
  /** Só o que se pode atribuir (pronto) ou desfazer (já atribuído) abre o Atribuir. */
  href: string | null
}

const isDeliveryOpen = (o: Order) => o.fulfillment === 'delivery' && (o.status === 'received' || o.status === 'preparing' || o.status === 'ready_for_delivery')

const where = (district: string) => [district, kmLabel(district)].filter(Boolean).join(' · ')
const moneyBR = (c: number) => `R$ ${(c / 100).toFixed(2).replace('.', ',')}`

export function dispatchRows(orders: Order[], records: DeliveryRecord[]): DispatchRow[] {
  const open = new Set(records.filter(isOpenRecord).map((r) => r.orderId))
  const rows: Array<DispatchRow & { sort: number }> = []

  for (const o of orders) {
    if (!isDeliveryOpen(o) || open.has(o.id)) continue
    const district = o.address?.district ?? ''
    const base = { orderId: o.id, customer: o.contact.name, tab: 'out' as const }
    if (o.status === 'ready_for_delivery') {
      const readyAt = o.stepTimes.ready_for_delivery
      rows.push({ ...base, label: 'Pronto', tone: 'success', detail: `${readyAt ? `Pronto às ${readyAt}` : 'Pronto'} · ${where(district)}`, href: `/gestao/entregas/atribuir/${o.id}`, sort: 0 })
    } else if (o.status === 'preparing') {
      rows.push({ ...base, label: 'Em preparo', tone: 'warning', detail: `Em separação · ${where(district)}`, href: null, sort: 1 })
    } else {
      rows.push({ ...base, label: 'Novo', tone: 'info', detail: `Aguardando aceite · ${where(district)}`, href: null, sort: 2 })
    }
  }

  for (const r of records) {
    const who = r.kind === 'own' ? `${r.courierName} (próprio)` : r.courierId ? `${r.courierName} (parceiro)` : 'Parceiro'
    const base = { orderId: r.orderId, customer: r.customer }
    if (r.status === 'delivered') rows.push({ ...base, label: 'Entregue', tone: 'success', detail: `${who} · entregue ${hhmm(r.at)}`, tab: 'done', href: null, sort: 1e15 - new Date(r.at).getTime() })
    else if (r.status === 'returned') rows.push({ ...base, label: 'Devolvida', tone: 'warning', detail: `${who} · devolvida ${hhmm(r.at)}${r.problem ? ` · ${r.problem.reason.toLowerCase()}` : ''}`, tab: 'done', href: null, sort: 1e15 - new Date(r.at).getTime() })
    else if (r.status === 'en_route') rows.push({ ...base, label: 'Em rota', tone: 'info', detail: `${who} · saiu ${hhmm(r.at)}${r.expectedAt ? ` · previsão ${hhmm(r.expectedAt)}` : ''}`, tab: 'route', href: null, sort: 0 })
    else {
      const label = r.status === 'assigned' ? 'Atribuída' : r.status === 'accepted' ? 'Aceita' : r.status === 'reserved' ? 'Reservada' : 'Publicada'
      const detail = r.status === 'assigned' || r.status === 'accepted' ? `${who} · aguardando sair` : r.status === 'reserved' ? `${who} · entra na lista quando voltar` : `Parceiros · ${cfg.partnersOnline} online · ${moneyBR(r.feeCents ?? cfg.partnerFeeCents)}`
      rows.push({ ...base, label, tone: 'neutral', detail, tab: 'out', href: `/gestao/entregas/atribuir/${r.orderId}`, sort: 3 })
    }
  }
  return rows.sort((a, b) => a.sort - b.sort).map((r) => ({ orderId: r.orderId, customer: r.customer, label: r.label, tone: r.tone, detail: r.detail, tab: r.tab, href: r.href }))
}

export type CourierRow = { id: string; name: string; initial: string; detail: string; tag: { label: string; tone: 'success' | 'info' | 'neutral' | 'warning' } }

const ownOf = (couriers: Courier[]) => couriers.filter((c) => c.kind === 'own')

export function courierRows(couriers: Courier[], records: DeliveryRecord[]): CourierRow[] {
  const rows: CourierRow[] = ownOf(couriers).map((c) => {
    const mine = records.filter((r) => r.courierId === c.id && isOpenRecord(r))
    const route = mine.find((r) => r.status === 'en_route')
    const held = mine.find((r) => r.status === 'assigned' || r.status === 'reserved' || r.status === 'accepted')
    const base = { id: c.id, name: c.name, initial: c.name.charAt(0) }
    if (route) return { ...base, detail: `Próprio · em rota com #${route.orderId}${route.returnAt ? `, volta ${hhmm(route.returnAt)}` : ''}`, tag: { label: 'Em rota', tone: 'info' } }
    if (held) return { ...base, detail: `Próprio · com #${held.orderId}, ${held.status === 'reserved' ? 'reservado' : 'sai em seguida'}`, tag: { label: 'Atribuído', tone: 'warning' } }
    if (!c.available) return { ...base, detail: 'Próprio · fora do turno', tag: { label: 'Fora do turno', tone: 'neutral' } }
    return { ...base, detail: 'Próprio · na loja', tag: { label: 'Disponível', tone: 'success' } }
  })
  rows.push({ id: 'partners', name: 'Parceiros', initial: 'P', detail: `Avulsos · ${cfg.partnersOnline} com o app aberto agora`, tag: { label: `${cfg.partnersOnline} online`, tone: 'neutral' } })
  return rows
}

export type AssignOptionId = string
export type AssignOption = { id: AssignOptionId; title: string; detail: string; tag: { label: string; tone: 'success' | 'info' | 'neutral' } | null; priceCents: number | null; button: string }

export function assignOptions(couriers: Courier[], records: DeliveryRecord[]): AssignOption[] {
  const opts: AssignOption[] = ownOf(couriers).filter((c) => c.available || records.some((r) => r.courierId === c.id && isOpenRecord(r))).map((c) => {
    const mine = records.filter((r) => r.courierId === c.id && isOpenRecord(r))
    const route = mine.find((r) => r.status === 'en_route')
    const held = mine.find((r) => r.status === 'assigned' || r.status === 'reserved' || r.status === 'accepted')
    if (route) return { id: c.id, title: `${c.name} · próprio`, detail: `${route.returnAt ? `Volta às ${hhmm(route.returnAt)}` : 'Em rota'} · pode levar junto na próxima saída`, tag: { label: 'Em rota', tone: 'info' }, priceCents: null, button: `Reservar para o ${c.name}` }
    if (held) return { id: c.id, title: `${c.name} · próprio`, detail: `Já tem #${held.orderId} · pode levar junto`, tag: { label: 'Atribuído', tone: 'neutral' }, priceCents: null, button: `Reservar para o ${c.name}` }
    return { id: c.id, title: `${c.name} · próprio`, detail: 'Na loja agora · sai em seguida', tag: { label: 'Disponível', tone: 'success' }, priceCents: null, button: `Enviar com o ${c.name}` }
  })
  opts.push({ id: 'partners', title: 'Publicar para parceiros', detail: `O primeiro que aceitar leva · ${cfg.partnersOnline} online`, tag: null, priceCents: cfg.partnerFeeCents, button: `Publicar por ${moneyBR(cfg.partnerFeeCents)}` })
  // O que está livre vem primeiro.
  return opts.sort((a, b) => Number(b.tag?.label === 'Disponível') - Number(a.tag?.label === 'Disponível'))
}

export type Assignment = { title: string; summary: string }

/** Cria a atribuição. Pedido precisa ser de entrega, estar pronto e não ter entrega aberta. */
export function assign(orders: Order[], records: DeliveryRecord[], couriers: Courier[], orderId: string, optionId: AssignOptionId, now: Date): { record: DeliveryRecord; assignment: Assignment } {
  const o = orders.find((x) => x.id === orderId)
  if (!o || o.fulfillment !== 'delivery') throw new DeliveryError('not_found')
  if (openRecordOf(records, orderId)) throw new DeliveryError('already_assigned')
  if (o.status !== 'ready_for_delivery') throw new DeliveryError('not_ready')
  const at = now.toISOString()
  const items = o.items.reduce((s, i) => s + i.qty, 0)
  const base = { orderId, customer: o.contact.name, district: o.address?.district ?? '', at, expectedAt: null, returnAt: null, items, problem: null }
  if (optionId === 'partners') {
    return {
      record: { ...base, courierId: null, courierName: 'Parceiros', kind: 'partner', status: 'published', feeCents: cfg.partnerFeeCents },
      assignment: { title: 'Publicado para parceiros', summary: `Avisamos aqui quando um parceiro aceitar. Se ninguém aceitar em ${cfg.partnerTimeoutMinutes} min, volta para você.` },
    }
  }
  const c = ownOf(couriers).find((x) => x.id === optionId)
  if (!c) throw new DeliveryError('not_found')
  const route = records.find((r) => r.courierId === c.id && r.status === 'en_route')
  if (route) {
    return {
      record: { ...base, courierId: c.id, courierName: c.name, kind: 'own', status: 'reserved', feeCents: null },
      assignment: { title: `Reservado para o ${c.name}`, summary: `Entra na lista do ${c.name} quando voltar${route.returnAt ? `, às ${hhmm(route.returnAt)}` : ''}.` },
    }
  }
  return {
    record: { ...base, courierId: c.id, courierName: c.name, kind: 'own', status: 'assigned', feeCents: null },
    assignment: { title: `${c.name} recebeu a entrega`, summary: `O pedido apareceu no app do ${c.name}. Quem comprou recebe o aviso quando sair.` },
  }
}

export function assignmentOf(record: DeliveryRecord): Assignment {
  if (record.status === 'published') return { title: 'Publicado para parceiros', summary: `Avisamos aqui quando um parceiro aceitar. Se ninguém aceitar em ${cfg.partnerTimeoutMinutes} min, volta para você.` }
  if (record.status === 'reserved') return { title: `Reservado para o ${record.courierName}`, summary: `Entra na lista do ${record.courierName} quando voltar.` }
  if (record.status === 'accepted') return { title: `${record.courierName} aceitou a entrega`, summary: 'Quando sair da loja, o pedido passa para Em rota.' }
  return { title: `${record.courierName} recebeu a entrega`, summary: `O pedido apareceu no app do ${record.courierName}. Quem comprou recebe o aviso quando sair.` }
}

/** Só dá para desfazer enquanto a entrega não saiu. */
export function unassign(records: DeliveryRecord[], orderId: string): DeliveryRecord[] {
  const r = openRecordOf(records, orderId)
  if (!r || r.status === 'en_route') throw new DeliveryError('no_assignment')
  return records.filter((x) => x !== r)
}
