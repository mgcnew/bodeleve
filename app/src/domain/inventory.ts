/**
 * Estoque: o saldo nunca é um número editável; vem das movimentações (DATA_MODEL_DRAFT.md).
 * Lote guarda só o que identifica a partida (código, validade, custo); quanto sobra de cada lote vem das movimentações.
 */

export type ItemType = 'resale' | 'raw_material' | 'finished'

export type ItemOrigin = 'house' | 'brand' | 'resale'

export type StockItem = {
  id: string
  name: string
  /** "1 L", "250 g", "400 g" */
  unit: string
  itemType: ItemType
  /** Origem/marca, separada do tipo de item (P-E). Matéria-prima não tem origem de venda. */
  origin: ItemOrigin | null
  /** Quanto cada unidade de estoque contém, para fichas técnicas: "Coalho líquido 50 ml" = 1 un com 50 ml. */
  content?: { qty: number; unit: string }
  /** Área do inventário ("Queijos e laticínios"): mesma lista de categorias da loja. */
  categoryId: string
  /** Estoque mínimo: abaixo disso o item aparece como "estoque baixo" e entra na sugestão de compra (H-G7). */
  minStock: number
  /** Item com validade: no recebimento, a validade é obrigatória (H-G8). */
  tracksExpiry: boolean
  supplierId: string | null
  lastCostCents: number | null
}

/** "Queijo coalho 500 g"; sem medida, só o nome. */
export const itemLabel = (it: Pick<StockItem, 'name' | 'unit'>) => (it.unit ? `${it.name} ${it.unit}` : it.name)

export type Lot = {
  id: string
  itemId: string
  /** Como está na embalagem: "LT-1120". */
  code: string
  expiresAt: string | null
  unitCostCents: number
  receivedAt: string
  /** De onde veio: "PC-0057", "Produção", "Inventário". */
  source: string
}

export type MovementType = 'purchase_in' | 'production_in' | 'production_out' | 'sale_out' | 'adjustment' | 'loss' | 'inventory'

export type StockMovement = {
  id: string
  itemId: string
  lotId: string | null
  type: MovementType
  /** Positivo entra, negativo sai. */
  qty: number
  at: string
  /** Documento de origem: "PC-0057", "V-0212"… */
  ref: string
  /** Como a movimentação aparece na lista: "Venda no balcão", "Perda · embalagem danificada". */
  description?: string
  /** Quem lançou, quando foi à mão (ajuste, perda, contagem). */
  by?: string
  /** Movimentações do mesmo ajuste ou da mesma contagem. */
  batchId?: string
  /** Movimentação que desfaz outra (o histórico nunca é apagado). */
  reversalOf?: string
}

/** Soma com arredondamento a 3 casas: quantidades decimais (0,4 un de coalho) não acumulam erro de ponto flutuante. */
export const sumMovements = (movements: StockMovement[], pick: (m: StockMovement) => boolean): number =>
  Math.round(movements.reduce((a, m) => (pick(m) ? a + m.qty : a), 0) * 1000) / 1000

export const lotBalance = (movements: StockMovement[], lotId: string) => sumMovements(movements, (m) => m.lotId === lotId)
export const itemBalance = (movements: StockMovement[], itemId: string) => sumMovements(movements, (m) => m.itemId === itemId)

/** Lotes com saldo, do que vence primeiro ao que vence depois; sem validade vão por último (H-G11). */
export function lotsFefo(lots: Lot[], movements: StockMovement[], itemId: string): Array<Lot & { balance: number }> {
  return lots
    .filter((l) => l.itemId === itemId)
    .map((l) => ({ ...l, balance: lotBalance(movements, l.id) }))
    .filter((l) => l.balance > 0)
    .sort((a, b) => (a.expiresAt ?? '9999').localeCompare(b.expiresAt ?? '9999') || a.receivedAt.localeCompare(b.receivedAt))
}

/** O lote que a saída deve usar primeiro. */
export const nextLot = (lots: Lot[], movements: StockMovement[], itemId: string) => lotsFefo(lots, movements, itemId)[0] ?? null

export type StockLevel = 'ok' | 'low' | 'out'
/** No quadro, "Estoque 6 un · mínimo 6" já é estoque baixo: no mínimo ou abaixo dele. */
export const levelOf = (balance: number, min: number): StockLevel => (balance <= 0 ? 'out' : balance <= min ? 'low' : 'ok')

/** Dias até vencer, contados em dias de calendário. Negativo = vencido. */
export function daysUntil(iso: string, now: Date): number {
  const a = new Date(iso)
  const d1 = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate())
  const d2 = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())
  return Math.round((d1 - d2) / 86_400_000)
}
