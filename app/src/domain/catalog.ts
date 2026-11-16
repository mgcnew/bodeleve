import type { ItemOrigin, ItemType, StockItem } from './inventory'

/**
 * Catálogo de produtos da gestão. O cadastro do item (nome, medida, tipo, origem, categoria, mínimo, validade) mora no estoque;
 * aqui entra só o que é de VENDA: preço, publicação na loja, favorito no PDV, peso e texto da loja (H-I58).
 */

export type SaleInfo = {
  itemId: string
  /** Preço de venda da embalagem, em centavos. Matéria-prima não tem preço. */
  priceCents: number | null
  /** Preço do quilo no balcão, para o que é vendido por peso (H-I80). A loja online segue vendendo a embalagem pelo preço acima. */
  weightPriceCents: number | null
  /** Aparece no catálogo da loja online. */
  published: boolean
  /** Fica na primeira tela do balcão (PDV). */
  favoritePos: boolean
  soldByWeight: boolean
  /** Descrição na loja. Enquanto o dono não escrever, fica o marcador entre colchetes. */
  description: string
}

/** `internal`: área do estoque que não é categoria da loja (insumos). */
export type CategoryRecord = { id: string; name: string; internal?: boolean }

export const DESCRIPTION_PLACEHOLDER = '[DESCRIÇÃO DO PRODUTO: como é feito, sabor, sugestão de uso]'

export type ProductKind = 'casa' | 'marca' | 'rev' | 'mp'
export const kindLabel: Record<ProductKind, string> = { casa: 'Feito na casa', marca: 'Marca Bodeleve', rev: 'Revenda', mp: 'Matéria-prima' }
export const kindFilters: Array<{ key: ProductKind | 'all'; label: string }> = [
  { key: 'all', label: 'Todos' },
  { key: 'casa', label: 'Feitos na casa' },
  { key: 'marca', label: 'Marca Bodeleve' },
  { key: 'rev', label: 'Revenda' },
  { key: 'mp', label: 'Matéria-prima' },
]

export function kindOf(item: Pick<StockItem, 'itemType' | 'origin'>): ProductKind {
  if (item.itemType === 'raw_material') return 'mp'
  if (item.origin === 'house') return 'casa'
  if (item.origin === 'brand') return 'marca'
  return 'rev'
}

export type Channel = 'store_and_counter' | 'counter_only' | 'none'
export function channelOf(item: Pick<StockItem, 'itemType'>, sale: Pick<SaleInfo, 'priceCents' | 'published'>): Channel {
  if (item.itemType === 'raw_material' || sale.priceCents == null) return 'none'
  return sale.published ? 'store_and_counter' : 'counter_only'
}

export function channelLabel(item: Pick<StockItem, 'itemType'>, sale: Pick<SaleInfo, 'priceCents' | 'published' | 'soldByWeight'>): string {
  const c = channelOf(item, sale)
  if (c === 'none') return 'Não vende'
  const base = c === 'store_and_counter' ? 'Loja e balcão' : 'Só balcão'
  return sale.soldByWeight ? `${base} (por peso)` : base
}

export const defaultSale = (itemId: string): SaleInfo => ({ itemId, priceCents: null, weightPriceCents: null, published: false, favoritePos: false, soldByWeight: false, description: DESCRIPTION_PLACEHOLDER })

export type ProductInput = {
  name: string
  categoryId: string
  itemType: ItemType
  origin: ItemOrigin | null
  priceCents: number | null
  weightPriceCents: number | null
  /** Texto digitado ("15 un"): só o número vale. */
  minStock: string
  published: boolean
  favoritePos: boolean
  soldByWeight: boolean
  tracksExpiry: boolean
  description: string
}

/** Primeiro número do texto: "15 un" → 15, "2,5" → 2.5. */
export function parseMinStock(text: string): number | null {
  const m = text.trim().match(/^(\d+(?:[.,]\d+)?)/)
  if (!m) return null
  return Number(m[1].replace(',', '.'))
}

export type ProductErrors = Partial<Record<'name' | 'price' | 'weightPrice' | 'minStock', string>>

export function validateProduct(input: ProductInput): ProductErrors {
  const e: ProductErrors = {}
  if (!input.name.trim()) e.name = 'Informe o nome do produto.'
  if (input.itemType !== 'raw_material' && (input.priceCents == null || input.priceCents <= 0)) e.price = 'Informe o preço de venda, por exemplo 32,90.'
  if (input.itemType !== 'raw_material' && input.soldByWeight && (input.weightPriceCents == null || input.weightPriceCents <= 0)) e.weightPrice = 'Informe o preço por kg, por exemplo 59,90.'
  if (parseMinStock(input.minStock) == null) e.minStock = 'Informe o estoque mínimo, por exemplo 15.'
  return e
}

/** O campo Nome mostra "Queijo coalho 500 g": se a medida continua no fim, ela volta para o campo próprio; senão tudo vira o nome. */
export function splitLabel(label: string, unit: string): { name: string; unit: string } {
  const l = label.trim()
  if (unit && l.endsWith(` ${unit}`)) return { name: l.slice(0, -(unit.length + 1)).trim(), unit }
  return { name: l, unit: unit && l === unit ? unit : '' }
}

/** Produto novo: a medida digitada no fim do nome ("Queijo coalho 500 g") vira a embalagem; sem medida, só o nome. */
export function splitNewLabel(label: string): { name: string; unit: string } {
  const l = label.trim().replace(/\s+/g, ' ')
  const m = l.match(/^(.*\S) (\d+(?:[.,]\d+)?) ?(kg|g|ml|l|un)$/i)
  if (!m) return { name: l, unit: '' }
  const u = m[3].toLowerCase()
  return { name: m[1], unit: `${m[2]} ${u === 'l' ? 'L' : u}` }
}

/** Aplica o formulário ao item de estoque e à venda. Matéria-prima não tem origem, preço, loja nem favorito. */
export function applyProduct(item: StockItem, sale: SaleInfo, input: ProductInput): { item: StockItem; sale: SaleInfo } {
  const raw = input.itemType === 'raw_material'
  return {
    item: {
      ...item,
      ...splitLabel(input.name, item.unit),
      categoryId: input.categoryId,
      itemType: input.itemType,
      origin: raw ? null : input.origin ?? 'resale',
      minStock: parseMinStock(input.minStock) ?? item.minStock,
      tracksExpiry: input.tracksExpiry,
    },
    sale: {
      ...sale,
      priceCents: raw ? null : input.priceCents,
      weightPriceCents: raw || !input.soldByWeight ? null : input.weightPriceCents,
      published: raw ? false : input.published,
      favoritePos: raw ? false : input.favoritePos,
      soldByWeight: raw ? false : input.soldByWeight,
      description: input.description.trim() || DESCRIPTION_PLACEHOLDER,
    },
  }
}

/** Margem para a tela: "57%" ou "—" sem preço ou sem custo. */
export function marginLabel(priceCents: number | null, costCents: number | null): string {
  if (priceCents == null || priceCents <= 0 || costCents == null) return '—'
  // Aqui o quadro arredonda para o inteiro mais próximo (56,8% → 57%); nas fichas técnicas ele arredonda para baixo.
  return `${Math.round(((priceCents - costCents) / priceCents) * 100)}%`
}

export function slugify(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export type CategoryError = 'empty' | 'duplicate'
export function checkNewCategory(name: string, existing: CategoryRecord[]): CategoryError | null {
  const n = slugify(name)
  if (!n) return 'empty'
  return existing.some((c) => slugify(c.name) === n) ? 'duplicate' : null
}
