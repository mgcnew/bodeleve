import type { Category, HomeSection, Order, Product, StoreContent } from '@/domain/types'

/** Dados FICTÍCIOS dos quadros de design (CLAUDE.md): só para desenvolvimento. */

const noDetails = {
  description: '[DESCRIÇÃO DO PRODUTO: como é feito, sabor, sugestão de uso]',
  conservation: '[COMO CONSERVAR]',
  validity: '[PRAZO DE VALIDADE]',
  ingredients: '[INGREDIENTES]',
}

export const categories: Category[] = [
  { id: 'laticinios', name: 'Queijos e laticínios' },
  { id: 'carnes', name: 'Carnes e embutidos' },
  { id: 'farinhas', name: 'Farinhas e grãos' },
  { id: 'doces', name: 'Doces' },
]

const p = (id: string, name: string, unit: string, priceCents: number, origin: Product['origin'], categoryId: string, available = true): Product => ({
  id, name, unit, priceCents, origin, categoryId, available, details: noDetails,
})

export const products: Product[] = [
  p('queijo-coalho', 'Queijo coalho', '500 g', 3290, 'house', 'laticinios'),
  p('queijo-manteiga', 'Queijo manteiga', '500 g', 3690, 'house', 'laticinios'),
  p('carne-de-sol', 'Carne de sol', '500 g', 3490, 'resale', 'carnes'),
  p('farinha-de-mandioca', 'Farinha de mandioca', '1 kg', 1290, 'resale', 'farinhas'),
  p('tapioca-granulada', 'Tapioca granulada', '500 g', 990, 'resale', 'farinhas'),
  p('doce-de-leite', 'Doce de leite', '400 g', 1890, 'house', 'laticinios'),
  p('rapadura', 'Rapadura', '400 g', 1450, 'brand', 'doces'),
  p('manteiga-de-garrafa', 'Manteiga de garrafa', '200 ml', 2800, 'brand', 'laticinios'),
  p('requeijao', 'Requeijão', '250 g', 1190, 'resale', 'laticinios'),
  p('nata', 'Nata', '200 g', 950, 'resale', 'laticinios'),
]

/** H-L3: seções do início. */
export const homeSections: HomeSection[] = [
  { id: 'pedidos', title: 'Mais pedidos', subtitle: 'O que mais sai no balcão.', productIds: ['queijo-coalho', 'carne-de-sol', 'farinha-de-mandioca', 'tapioca-granulada'] },
  { id: 'casa', title: 'Feitos na casa', subtitle: 'Produzidos aqui, em pequenos lotes.', productIds: ['queijo-manteiga', 'doce-de-leite'] },
  { id: 'marca', title: 'Linha Bodeleve', subtitle: 'Produtos com a marca da casa.', productIds: ['rapadura', 'manteiga-de-garrafa'] },
]

export const content: StoreContent = {
  homeText: '[TEXTO DA CASA: de onde vem, há quanto tempo existe, o que produz]',
  aboutHistory: '[HISTÓRIA DA CASA: quem fundou, quando, de onde vêm as receitas e os produtos]',
  address: '[ENDEREÇO DA LOJA]',
  hours: '[HORÁRIO DE FUNCIONAMENTO]',
  whatsapp: '[WHATSAPP DA LOJA]',
  brandText: '[TEXTO DA LINHA: o que é, por que existe, o que garante]',
  brandUpcoming: '[PRÓXIMOS PRODUTOS DA LINHA]',
  brandWhere: '[NA CASA OU POR PARCEIRO]',
  brandCommitment: '[COMPROMISSO DA MARCA]',
}

const item = (productId: string, qty: number) => {
  const pr = products.find((x) => x.id === productId)!
  return { productId, name: pr.name, unit: pr.unit, unitPriceCents: pr.priceCents, qty }
}

const contact = { name: 'Ana Souza', phone: '(00) 90000-0000' }
const address = { cep: '00000-000', street: 'Rua das Camélias', number: '120', complement: 'apto 34', district: 'Jardim das Flores', reference: '' }
const asap = { id: 'asap', label: 'O quanto antes', detail: 'Hoje, em 40 a 60 minutos' }

/** Pedidos de exemplo dos quadros (1042 em andamento, 1017 e 0988 concluídos). */
export const seedOrders: Order[] = [
  {
    id: '1042', createdAt: '2026-11-15T14:52:00-03:00', status: 'out_for_delivery', fulfillment: 'delivery',
    items: [item('queijo-coalho', 1), item('farinha-de-mandioca', 2), item('rapadura', 1)],
    subtotalCents: 7320, deliveryFeeCents: 800, totalCents: 8120, contact, address, window: asap,
    payment: { method: 'pix', changeForCents: null }, deliveryCode: '4821', etaLabel: 'Hoje, 15h40', courierName: 'Carlos',
    stepTimes: { received: '14h52', preparing: '14h58', out_for_delivery: '15h12' },
  },
  {
    id: '1017', createdAt: '2026-11-02T10:40:00-03:00', status: 'delivered', fulfillment: 'delivery',
    items: [item('queijo-coalho', 2), item('tapioca-granulada', 1), item('farinha-de-mandioca', 1)],
    subtotalCents: 8860, deliveryFeeCents: 800, totalCents: 9660, contact, address, window: asap,
    payment: { method: 'pix', changeForCents: null }, deliveryCode: '1017', etaLabel: null, courierName: null,
    stepTimes: { delivered: '11h20' },
  },
  {
    id: '0988', createdAt: '2026-10-21T16:10:00-03:00', status: 'picked_up', fulfillment: 'pickup',
    items: [item('queijo-coalho', 1), item('farinha-de-mandioca', 1)],
    subtotalCents: 4580, deliveryFeeCents: 0, totalCents: 4580, contact, address: null,
    window: { id: 'asap', label: 'Assim que estiver pronto', detail: 'Avisamos pelo WhatsApp' },
    payment: { method: 'cash', changeForCents: null }, deliveryCode: '0988', etaLabel: null, courierName: null,
    stepTimes: { picked_up: '17h05' },
  },
]
