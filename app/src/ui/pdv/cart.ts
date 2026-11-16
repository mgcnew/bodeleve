import { discountCents, priceLine, subtotalOf, type CartLine, type PriceInfo, type SaleLine } from '@/domain/pos'
import type { PosProduct } from '@/services/types'

const infoOf = (p: PosProduct): PriceInfo => ({ name: p.name, unit: p.unit, priceCents: p.perKg ? 0 : p.priceCents, weightPriceCents: p.perKg ? p.priceCents : null })

export type PricedCart = { lines: Array<SaleLine & { key: string }>; subtotalCents: number; discountCents: number; totalCents: number; count: number }

/** Preços da sacola a partir do catálogo do balcão. Linha de produto que saiu do catálogo é ignorada. */
export function priceCart(lines: CartLine[], products: PosProduct[], discount: { kind: Parameters<typeof discountCents>[0] } | null): PricedCart {
  const out: Array<SaleLine & { key: string }> = []
  for (const l of lines) {
    const p = products.find((x) => x.id === l.itemId)
    if (!p) continue
    try {
      out.push({ ...priceLine(l, infoOf(p)), key: l.key })
    } catch {
      /* linha inválida (por exemplo, unidade de um produto por peso): não entra */
    }
  }
  const subtotal = subtotalOf(out)
  const disc = discount ? discountCents(discount.kind, subtotal) : 0
  return { lines: out, subtotalCents: subtotal, discountCents: disc, totalCents: subtotal - disc, count: out.reduce((a, l) => a + (l.kind === 'unit' ? l.qty : 1), 0) }
}
