// Dados fictícios das telas da loja (design/Loja-*.dc.html). Só para desenvolvimento.
import type { Category, Product } from '@/domain/catalog'

// H-L11 — categorias de exemplo (Q1)
export const categories: Category[] = [
  { id: 'queijos', name: 'Queijos e laticínios' },
  { id: 'carnes', name: 'Carnes e embutidos' },
  { id: 'farinhas', name: 'Farinhas e grãos' },
  { id: 'doces', name: 'Doces' },
]

/** Categorias internas da gestão (não aparecem na loja) */
export const internalCategories: Category[] = [{ id: 'insumos', name: 'Insumos' }]

const content = {
  description: '[DESCRIÇÃO DO PRODUTO: como é feito, sabor, sugestão de uso]',
  storage: '[COMO CONSERVAR]',
  shelfLife: '[PRAZO DE VALIDADE]',
  ingredients: '[INGREDIENTES]',
}

type Seed = Pick<Product, 'id' | 'name' | 'sizeLabel' | 'priceCents' | 'origin' | 'categoryId'> &
  Partial<Pick<Product, 'popularRank' | 'available'>>

const seed: Seed[] = [
  { id: 'queijo-coalho', name: 'Queijo coalho', sizeLabel: '500 g', priceCents: 3290, origin: 'house_made', categoryId: 'queijos', popularRank: 1 },
  { id: 'carne-de-sol', name: 'Carne de sol', sizeLabel: '500 g', priceCents: 3490, origin: 'third_party', categoryId: 'carnes', popularRank: 2 },
  { id: 'farinha-de-mandioca', name: 'Farinha de mandioca', sizeLabel: '1 kg', priceCents: 1290, origin: 'third_party', categoryId: 'farinhas', popularRank: 3 },
  { id: 'tapioca-granulada', name: 'Tapioca granulada', sizeLabel: '500 g', priceCents: 990, origin: 'third_party', categoryId: 'farinhas', popularRank: 4, available: false },
  { id: 'queijo-manteiga', name: 'Queijo manteiga', sizeLabel: '500 g', priceCents: 3690, origin: 'house_made', categoryId: 'queijos' },
  { id: 'doce-de-leite', name: 'Doce de leite', sizeLabel: '400 g', priceCents: 1890, origin: 'house_made', categoryId: 'doces' },
  { id: 'rapadura', name: 'Rapadura', sizeLabel: '400 g', priceCents: 1450, origin: 'bodeleve_brand', categoryId: 'doces' },
  { id: 'manteiga-de-garrafa', name: 'Manteiga de garrafa', sizeLabel: '200 ml', priceCents: 2800, origin: 'bodeleve_brand', categoryId: 'queijos' },
  { id: 'requeijao', name: 'Requeijão', sizeLabel: '250 g', priceCents: 1190, origin: 'third_party', categoryId: 'queijos' },
  { id: 'nata', name: 'Nata', sizeLabel: '200 g', priceCents: 950, origin: 'third_party', categoryId: 'queijos' },
]

export const products: Product[] = seed.map((p) => ({ popularRank: null, available: true, ...content, ...p }))
