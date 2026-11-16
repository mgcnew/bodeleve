// Pedidos do dia na gestão (design/Gestao-Pedidos e Gestao-Pedido). Dados fictícios.
import { daysFromToday, minutesBefore } from '@/domain/dates'
import type { StaffOrder, StaffOrderItem } from '@/domain/staffOrder'

const item = (productId: string, name: string, qtyLabel: string, quantity: number, unitPriceCents: number, lot: string | null = null, expiryDays: number | null = null): StaffOrderItem => ({
  productId,
  name,
  qtyLabel,
  quantity,
  unitPriceCents,
  lot,
  lotExpiry: expiryDays === null ? null : daysFromToday(expiryDays),
})

const queijo = (q = 1) => item('queijo-coalho', 'Queijo coalho', `${q} un · 500 g`, q, 3290, 'QC-1107', 5)
const farinha = (q = 1) => item('farinha-de-mandioca', 'Farinha de mandioca', `${q} un · 1 kg`, q, 1290, 'FM-0921')
const tapioca = (q = 1) => item('tapioca-granulada', 'Tapioca granulada', `${q} un · 500 g`, q, 990, 'TG-1030')
const rapadura = (q = 1) => item('rapadura', 'Rapadura', `${q} un · 400 g`, q, 1450, 'RB-0412', 120)
const doce = (q = 1) => item('doce-de-leite', 'Doce de leite', `${q} un · 400 g`, q, 1890, 'DL-1102', 6)
const carne = (q = 1) => item('carne-de-sol', 'Carne de sol', `${q} un · 500 g`, q, 3490, 'CS-1110', 9)

function order(o: Omit<StaffOrder, 'checked'>): StaffOrder {
  return { ...o, checked: o.items.map(() => o.status !== 'new' && o.status !== 'separating') }
}

export const seedStaffOrders = (): StaffOrder[] => [
  order({
    id: 'g-1043', number: '1043', createdAt: minutesBefore(10), status: 'new',
    customer: { id: 'maria-lima', name: 'Maria Lima', phone: '(00) 90000-0001', since: daysFromToday(-250), orderCount: 5 },
    fulfillment: 'delivery', address: { line1: 'Av. das Palmeiras, 455 · casa 2', line2: 'Centro' }, distanceKm: 1.8, windowLabel: 'O quanto antes',
    items: [queijo(), farinha(), tapioca()], feeCents: 800, paymentLabel: 'Pix', paid: true, courierName: null,
  }),
  order({
    id: 'g-1044', number: '1044', createdAt: minutesBefore(4), status: 'new',
    customer: { id: 'joao-pedro', name: 'João Pedro', phone: '(00) 90000-0002', since: daysFromToday(-40), orderCount: 2 },
    fulfillment: 'pickup', address: null, windowLabel: 'Assim que estiver pronto',
    items: [queijo(), item('nata', 'Nata', '1 un · 200 g', 1, 1490)], feeCents: 0, paymentLabel: 'Pagar na retirada', paid: false, courierName: null,
  }),
  order({
    id: 'g-1041', number: '1041', createdAt: minutesBefore(50), status: 'separating',
    customer: { id: 'paula-reis', name: 'Paula Reis', phone: '(00) 90000-0003', since: daysFromToday(-400), orderCount: 11 },
    fulfillment: 'delivery', address: { line1: 'Rua do Sol, 88', line2: 'Bairro Alto' }, distanceKm: 4.1, windowLabel: 'Hoje à tarde',
    items: [queijo(2), carne(), doce(), farinha()], feeCents: 800, paymentLabel: 'Pix', paid: true, courierName: null,
  }),
  order({
    id: 'g-1040', number: '1040', createdAt: minutesBefore(59), status: 'separating',
    customer: { id: 'carla-nunes', name: 'Carla Nunes', phone: '(00) 90000-0004', since: daysFromToday(-90), orderCount: 3 },
    fulfillment: 'pickup', address: null, windowLabel: 'Assim que estiver pronto',
    items: [rapadura(2), doce(), queijo()], feeCents: 0, paymentLabel: 'Pix', paid: true, courierName: null,
  }),
  order({
    id: 'g-1039', number: '1039', createdAt: minutesBefore(92), status: 'ready',
    customer: { id: 'rafael-dias', name: 'Rafael Dias', phone: '(00) 90000-0005', since: daysFromToday(-15), orderCount: 1 },
    fulfillment: 'pickup', address: null, windowLabel: 'Assim que estiver pronto',
    items: [farinha(2), tapioca()], feeCents: 0, paymentLabel: 'Pix', paid: true, courierName: null,
  }),
  order({
    id: 'g-1042', number: '1042', createdAt: minutesBefore(38), status: 'en_route',
    customer: { id: 'ana-souza', name: 'Ana Souza', phone: '(00) 90000-0000', since: daysFromToday(-120), orderCount: 4 },
    fulfillment: 'delivery', address: { line1: 'Rua das Camélias, 120 · apto 34', line2: 'Jardim das Flores' }, distanceKm: 2.6, windowLabel: 'O quanto antes',
    items: [queijo(), farinha(2), rapadura()], feeCents: 800, paymentLabel: 'Pix', paid: true, courierName: 'Carlos',
  }),
  order({
    id: 'g-1038', number: '1038', createdAt: minutesBefore(150), status: 'delivered',
    customer: { id: 'rafael-dias', name: 'Rafael Dias', phone: '(00) 90000-0005', since: daysFromToday(-15), orderCount: 1 },
    fulfillment: 'delivery', address: { line1: 'Rua Nova, 12', line2: 'Centro' }, distanceKm: 1.2, windowLabel: 'O quanto antes',
    items: [farinha(), tapioca()], feeCents: 800, paymentLabel: 'Pix', paid: true, courierName: 'Bruno',
  }),
  order({
    id: 'g-1036', number: '1036', createdAt: minutesBefore(420), status: 'delivered',
    customer: { id: 'paula-reis', name: 'Paula Reis', phone: '(00) 90000-0003', since: daysFromToday(-400), orderCount: 11 },
    fulfillment: 'delivery', address: { line1: 'Rua do Sol, 88', line2: 'Bairro Alto' }, distanceKm: 4.1, windowLabel: 'Hoje à tarde',
    items: [doce(), queijo()], feeCents: 800, paymentLabel: 'Pix', paid: true, courierName: 'Parceiro',
  }),
]
