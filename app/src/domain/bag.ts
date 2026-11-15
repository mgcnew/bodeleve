import type { Fulfillment, Product } from './types'

export type BagLine = { product: Product; qty: number; totalCents: number }

/** Junta as quantidades guardadas na sacola com os produtos do catálogo. Ignora o que saiu do catálogo. */
export function buildLines(items: Record<string, number>, products: Product[]): BagLine[] {
  const byId = new Map(products.map((p) => [p.id, p]))
  const lines: BagLine[] = []
  for (const [id, qty] of Object.entries(items)) {
    const product = byId.get(id)
    if (product && qty > 0) lines.push({ product, qty, totalCents: product.priceCents * qty })
  }
  return lines
}

export type Totals = { itemCount: number; subtotalCents: number; deliveryFeeCents: number; totalCents: number }

export function computeTotals(lines: BagLine[], fulfillment: Fulfillment, deliveryFeeCents: number): Totals {
  const subtotalCents = lines.reduce((sum, l) => sum + l.totalCents, 0)
  const fee = fulfillment === 'delivery' && lines.length > 0 ? deliveryFeeCents : 0
  return {
    itemCount: lines.reduce((sum, l) => sum + l.qty, 0),
    subtotalCents,
    deliveryFeeCents: fee,
    totalCents: subtotalCents + fee,
  }
}

/** "1 item" / "3 itens" */
export function itemsLabel(count: number): string {
  return `${count} ${count === 1 ? 'item' : 'itens'}`
}
