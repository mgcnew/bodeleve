// Pedidos de exemplo das telas Loja-Pedidos, Loja-Acompanhamento e Loja-Pedido
import type { Order } from '@/domain/order'

function todayAt(h: number, m: number) {
  const d = new Date()
  d.setHours(h, m, 0, 0)
  return d.toISOString()
}

const address = {
  cep: '00000-000',
  street: 'Rua das Camélias',
  number: '120',
  complement: 'apto 34',
  district: 'Jardim das Flores',
  reference: '',
}
const contact = { name: 'Ana Souza', phone: '(00) 90000-0000' }

export const sampleOrders: Order[] = [
  {
    id: 'pedido-1042',
    number: '1042',
    createdAt: todayAt(14, 52),
    status: 'out_for_delivery',
    statusTimes: { received: todayAt(14, 52), preparing: todayAt(14, 58), out_for_delivery: todayAt(15, 12) },
    fulfillment: 'delivery',
    address,
    windowLabel: 'O quanto antes · hoje, em 40 a 60 minutos',
    estimatedAt: todayAt(15, 40),
    courierNote: 'com Carlos, entregador da casa',
    payment: 'pix',
    changeForCents: null,
    contact,
    items: [
      { productId: 'queijo-coalho', name: 'Queijo coalho', quantity: 1, unitPriceCents: 3290 },
      { productId: 'farinha-de-mandioca', name: 'Farinha de mandioca', quantity: 2, unitPriceCents: 1290 },
      { productId: 'rapadura', name: 'Rapadura', quantity: 1, unitPriceCents: 1450 },
    ],
    feeCents: 800,
    deliveryCode: '4821',
  },
  {
    id: 'pedido-1017',
    number: '1017',
    createdAt: '2026-11-02T11:20:00-03:00',
    status: 'delivered',
    statusTimes: { delivered: '2026-11-02T11:20:00-03:00' },
    fulfillment: 'delivery',
    address,
    windowLabel: 'O quanto antes',
    estimatedAt: null,
    courierNote: null,
    payment: 'pix',
    changeForCents: null,
    contact,
    items: [
      { productId: 'queijo-coalho', name: 'Queijo coalho', quantity: 2, unitPriceCents: 3290 },
      { productId: 'tapioca-granulada', name: 'Tapioca granulada', quantity: 1, unitPriceCents: 990 },
      { productId: 'farinha-de-mandioca', name: 'Farinha de mandioca', quantity: 1, unitPriceCents: 1290 },
    ],
    feeCents: 800,
    deliveryCode: '1730',
  },
  {
    id: 'pedido-0988',
    number: '0988',
    createdAt: '2026-10-21T10:05:00-03:00',
    status: 'picked_up',
    statusTimes: { picked_up: '2026-10-21T10:05:00-03:00' },
    fulfillment: 'pickup',
    address: null,
    windowLabel: 'Assim que estiver pronto',
    estimatedAt: null,
    courierNote: null,
    payment: 'cash',
    changeForCents: null,
    contact,
    items: [
      { productId: 'queijo-manteiga', name: 'Queijo manteiga', quantity: 1, unitPriceCents: 3690 },
      { productId: 'tapioca-granulada', name: 'Tapioca granulada', quantity: 1, unitPriceCents: 990 },
    ],
    feeCents: 0,
    deliveryCode: '0912',
  },
]
