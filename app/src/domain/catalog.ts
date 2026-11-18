import type { Cents } from './money'

export type ProductOrigin = 'third_party' | 'house_made' | 'bodeleve_brand'

export type Category = { id: string; name: string }

/** Produto como a loja o vê (só itens publicados) */
export type Product = {
  id: string
  name: string
  /** apresentação, ex.: "500 g", "Peça de 500 g" */
  sizeLabel: string
  priceCents: Cents
  origin: ProductOrigin
  categoryId: string
  /** posição em "Mais pedidos"; null fora da lista */
  popularRank: number | null
  available: boolean
  /** conteúdo do dono (P5); marcadores entre colchetes até haver texto real */
  description: string
  storage: string
  shelfLife: string
  ingredients: string
  /** foto do produto; sem ela a loja mostra o marcador */
  photoUrl?: string | null
}

const originNames: Record<ProductOrigin, string> = {
  house_made: 'Feito na casa',
  bodeleve_brand: 'Marca Bodeleve',
  third_party: 'Escolhido pela casa',
}

export function originName(origin: ProductOrigin) {
  return originNames[origin]
}

/** Busca sem acento e sem caixa */
export function normalize(text: string) {
  return text.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
}

export function plural(n: number, one: string, many: string) {
  return `${n} ${n === 1 ? one : many}`
}
