import type { CategoryRecord, SaleInfo } from '@/domain/catalog'
import { DESCRIPTION_PLACEHOLDER } from '@/domain/catalog'
import type { CustomerRecord } from '@/domain/customers'
import { products as storeProducts } from './seed'

/** Catálogo e clientes de EXEMPLO (quadros Produtos, Categorias e Clientes). */

export const categoriesSeed: CategoryRecord[] = [
  { id: 'laticinios', name: 'Queijos e laticínios' },
  { id: 'carnes', name: 'Carnes e embutidos' },
  { id: 'farinhas', name: 'Farinhas e grãos' },
  { id: 'doces', name: 'Doces' },
  { id: 'insumos', name: 'Insumos', internal: true },
]

/**
 * Venda dos itens da loja: o preço e a publicação vêm do catálogo da loja (mesmos números dos quadros).
 * Charque, flocão, fubá e melaço são vendidos só no balcão; o restante do estoque é matéria-prima e não vende.
 */
const counterOnly: Array<[id: string, priceCents: number]> = [['charque', 3990], ['flocao-de-milho', 590], ['fuba', 520], ['melaco-de-cana', 1890]]
const favorites = new Set(['queijo-coalho', 'queijo-manteiga', 'carne-de-sol', 'farinha-de-mandioca', 'rapadura'])

export function buildSalesSeed(): SaleInfo[] {
  const store: SaleInfo[] = storeProducts.map((p) => ({
    itemId: p.id,
    priceCents: p.priceCents,
    published: true,
    favoritePos: favorites.has(p.id),
    soldByWeight: false,
    description: p.details.description,
  }))
  const counter: SaleInfo[] = counterOnly.map(([itemId, priceCents]) => ({ itemId, priceCents, published: false, favoritePos: false, soldByWeight: itemId === 'charque', description: DESCRIPTION_PLACEHOLDER }))
  return [...store, ...counter]
}

/** `since` e a data do primeiro pedido são relativos a hoje para a tela sempre parecer atual. */
export function buildCustomersSeed(now: Date): CustomerRecord[] {
  const thisMonth = `${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`
  const base = (orders: number, spentCents: number, products: Record<string, number> = {}) => ({ orders, spentCents, products })
  return [
    // Os totais de exemplo fecham com o quadro: o que falta para o total é o histórico anterior aos pedidos desta base.
    { phone: '(00) 90000-0001', name: 'Maria Lima', since: '03/2026', notes: 'Prefere queijo mais curado.', channelNote: null, baseline: base(2, 12860, { 'queijo-coalho': 2 }) },
    { phone: '(00) 90000-0000', name: 'Ana Souza', since: '01/2026', notes: '', channelNote: null, baseline: base(0, 1250) },
    { phone: '(00) 90000-0006', name: 'Dona Zefa', since: '05/2026', notes: 'Paga o fiado no fim do mês.', channelNote: 'Balcão · compra fiado', baseline: base(0, 102000) },
    { phone: '(00) 90000-0003', name: 'Paula Reis', since: '02/2026', notes: '', channelNote: null, baseline: base(7, 77260) },
    { phone: '(00) 90000-0002', name: 'João Pedro', since: thisMonth, notes: '', channelNote: null, baseline: base(0, 0) },
    { phone: '(00) 90000-0004', name: 'Carla Nunes', since: thisMonth, notes: '', channelNote: null, baseline: base(0, 0) },
    { phone: '(00) 90000-0005', name: 'Rafael Dias', since: thisMonth, notes: '', channelNote: null, baseline: base(0, 0) },
  ]
}
