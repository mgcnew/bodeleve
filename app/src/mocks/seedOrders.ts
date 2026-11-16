import type { Contact, Order, OrderItem, OrderStatus, PaymentMethod, TimeWindow } from '@/domain/types'
import { products } from './seed'

/**
 * Pedidos e clientes de EXEMPLO (dados fictícios dos quadros). Os horários são relativos ao momento em que o banco
 * simulado é criado, para a tela sempre parecer "agora" (nos quadros: sábado, 15h30).
 */

const MIN = 60_000
export const hhmm = (d: Date) => `${String(d.getHours()).padStart(2, '0')}h${String(d.getMinutes()).padStart(2, '0')}`
const ago = (now: Date, minutes: number) => new Date(now.getTime() - minutes * MIN)

const item = (productId: string, qty: number, unitPriceCents?: number): OrderItem => {
  const pr = products.find((x) => x.id === productId)!
  return { productId, name: pr.name, unit: pr.unit, unitPriceCents: unitPriceCents ?? pr.priceCents, qty }
}
const sum = (items: OrderItem[]) => items.reduce((a, i) => a + i.unitPriceCents * i.qty, 0)

const asap: TimeWindow = { id: 'asap', label: 'O quanto antes', detail: 'Hoje, em 40 a 60 minutos' }
const pickupAsap: TimeWindow = { id: 'asap', label: 'Assim que estiver pronto', detail: 'Avisamos pelo WhatsApp' }

type Spec = {
  id: string
  channel?: 'online' | 'pos'
  minutesAgo?: number
  at?: string
  status: OrderStatus
  delivery: boolean
  items: OrderItem[]
  contact: Contact
  address?: { street: string; number: string; complement: string; district: string }
  method: PaymentMethod
  paid: boolean
  code: string
  stepMinutesAgo?: Partial<Record<OrderStatus, number>>
  etaInMinutes?: number
  courierName?: string
  stepTimes?: Partial<Record<OrderStatus, string>>
}

function make(now: Date, sp: Spec): Order {
  const created = sp.at ? new Date(sp.at) : ago(now, sp.minutesAgo ?? 0)
  const subtotalCents = sum(sp.items)
  const deliveryFeeCents = sp.delivery ? 800 : 0
  const stepTimes: Order['stepTimes'] = { ...(sp.stepTimes ?? {}) }
  if (!sp.at) stepTimes.received = hhmm(created)
  for (const [k, m] of Object.entries(sp.stepMinutesAgo ?? {})) stepTimes[k as OrderStatus] = hhmm(ago(now, m))
  return {
    id: sp.id,
    channel: sp.channel ?? 'online',
    createdAt: created.toISOString(),
    status: sp.status,
    fulfillment: sp.delivery ? 'delivery' : 'pickup',
    items: sp.items,
    subtotalCents,
    deliveryFeeCents,
    totalCents: subtotalCents + deliveryFeeCents,
    contact: sp.contact,
    address: sp.delivery && sp.address ? { cep: '00000-000', reference: '', ...sp.address } : null,
    window: sp.delivery ? asap : pickupAsap,
    payment: { method: sp.method, changeForCents: null, paid: sp.paid },
    deliveryCode: sp.code,
    etaLabel: sp.etaInMinutes != null ? `Hoje, ${hhmm(new Date(now.getTime() + sp.etaInMinutes * MIN))}` : null,
    courierName: sp.courierName ?? null,
    stepTimes,
  }
}

const ana: Contact = { name: 'Ana Souza', phone: '(00) 90000-0000' }
const maria: Contact = { name: 'Maria Lima', phone: '(00) 90000-0001' }
const mariaAddress = { street: 'Av. das Palmeiras', number: '455', complement: 'casa 2', district: 'Centro' }
const camelias = { street: 'Rua das Camélias', number: '120', complement: 'apto 34', district: 'Jardim das Flores' }

/** Os pedidos feitos "neste aparelho" nos quadros da loja: 1042 em andamento, 1017 e 0988 concluídos. */
export const DEVICE_SEED_IDS = ['1042', '1017', '0988']

export function buildSeedOrders(now: Date): Order[] {
  return [
    // — Loja: pedidos deste aparelho —
    make(now, {
      id: '1042', minutesAgo: 38, status: 'out_for_delivery', delivery: true, contact: ana, address: camelias, method: 'pix', paid: true, code: '4821',
      items: [item('queijo-coalho', 1), item('farinha-de-mandioca', 2), item('rapadura', 1)], etaInMinutes: 10, courierName: 'Carlos',
      stepMinutesAgo: { preparing: 32, out_for_delivery: 18 },
    }),
    make(now, {
      id: '1017', at: '2026-11-02T10:40:00-03:00', status: 'delivered', delivery: true, contact: ana, address: camelias, method: 'pix', paid: true, code: '1017',
      items: [item('queijo-coalho', 2), item('tapioca-granulada', 1), item('farinha-de-mandioca', 1)], stepTimes: { delivered: '11h20' },
    }),
    make(now, {
      id: '0988', at: '2026-10-21T16:10:00-03:00', status: 'picked_up', delivery: false, contact: ana, method: 'cash', paid: true, code: '0988',
      items: [item('queijo-coalho', 1), item('farinha-de-mandioca', 1)], stepTimes: { picked_up: '17h05' },
    }),
    // — Histórico da Maria Lima (quadro Cliente): um pedido entregue e um retirado —
    make(now, {
      // Tapioca a R$ 11,70: preço de quando o pedido foi feito (o total do quadro, R$ 98,40, não fecha com o preço de hoje).
      id: '1021', at: '2026-11-06T14:20:00-03:00', status: 'delivered', delivery: true, contact: maria,
      address: mariaAddress, method: 'pix', paid: true, code: '1021',
      items: [item('queijo-coalho', 2), item('farinha-de-mandioca', 1), item('tapioca-granulada', 1, 1170)], stepTimes: { delivered: '15h05' },
    }),
    make(now, {
      id: '0997', at: '2026-10-24T11:05:00-03:00', status: 'picked_up', delivery: false, contact: maria, method: 'cash', paid: true, code: '0997',
      items: [item('queijo-coalho', 2), item('farinha-de-mandioca', 1), item('doce-de-leite', 1), item('rapadura', 1), item('nata', 1)], stepTimes: { picked_up: '11h40' },
    }),
    // — Gestão: fila do dia (nomes e totais dos quadros) —
    make(now, {
      id: '1043', minutesAgo: 10, status: 'received', delivery: true, contact: maria,
      address: mariaAddress, method: 'pix', paid: true, code: '3055',
      items: [item('queijo-coalho', 1), item('farinha-de-mandioca', 1), item('tapioca-granulada', 1)],
    }),
    make(now, {
      id: '1044', minutesAgo: 4, status: 'received', delivery: false, contact: { name: 'João Pedro', phone: '(00) 90000-0002' }, method: 'cash', paid: false, code: '7164',
      items: [item('carne-de-sol', 1), item('farinha-de-mandioca', 1)],
    }),
    make(now, {
      id: '1041', minutesAgo: 50, status: 'preparing', delivery: true, contact: { name: 'Paula Reis', phone: '(00) 90000-0003' },
      address: { street: 'Rua do Sol', number: '88', complement: '', district: 'Bairro Alto' }, method: 'pix', paid: true, code: '2290',
      items: [item('queijo-manteiga', 1), item('farinha-de-mandioca', 2), item('doce-de-leite', 1), item('rapadura', 1), item('manteiga-de-garrafa', 1)],
      stepMinutesAgo: { preparing: 45 },
    }),
    make(now, {
      id: '1040', minutesAgo: 59, status: 'preparing', delivery: false, contact: { name: 'Carla Nunes', phone: '(00) 90000-0004' }, method: 'pix', paid: true, code: '5518',
      items: [item('queijo-coalho', 1), item('farinha-de-mandioca', 1), item('rapadura', 1), item('manteiga-de-garrafa', 1)],
      stepMinutesAgo: { preparing: 55 },
    }),
    make(now, {
      // Nata a R$ 8,50: preço de quando o pedido foi feito (o total dos quadros, R$ 41,40, não fecha com os preços de hoje).
      id: '1039', minutesAgo: 92, status: 'ready_for_pickup', delivery: false, contact: { name: 'Rafael Dias', phone: '(00) 90000-0005' }, method: 'pix', paid: true, code: '8842',
      items: [item('queijo-coalho', 1), item('nata', 1, 850)], stepMinutesAgo: { preparing: 88, ready_for_pickup: 70 },
    }),
  ]
}

/** Clientes conhecidos: desde quando e quantos pedidos tinham antes dos de hoje ("cliente desde 03/2026 · 5 pedidos"). */
export const customersSeed: Record<string, { since: string; previousOrders: number }> = {
  '(00) 90000-0001': { since: '03/2026', previousOrders: 2 }, // + 1043, 1021 e 0997 = 5 pedidos
  '(00) 90000-0000': { since: '01/2026', previousOrders: 2 },
  '(00) 90000-0002': { since: '08/2026', previousOrders: 1 },
}

