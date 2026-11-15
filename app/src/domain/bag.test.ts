import { describe, expect, it } from 'vitest'
import { buildLines, computeTotals, itemsLabel } from './bag'
import type { Product } from './types'

const p = (id: string, priceCents: number): Product => ({
  id, name: id, unit: '1 un', priceCents, origin: 'resale', categoryId: 'c', available: true,
  details: { description: '', conservation: '', validity: '', ingredients: '' },
})
const catalog = [p('coalho', 3290), p('farinha', 1290), p('rapadura', 1450)]

describe('sacola', () => {
  it('reproduz o exemplo dos quadros: 1 coalho + 2 farinha + 1 rapadura = R$ 73,20 + R$ 8,00 = R$ 81,20', () => {
    const lines = buildLines({ coalho: 1, farinha: 2, rapadura: 1 }, catalog)
    const t = computeTotals(lines, 'delivery', 800)
    expect(t).toEqual({ itemCount: 4, subtotalCents: 7320, deliveryFeeCents: 800, totalCents: 8120 })
  })
  it('retirada na loja não paga entrega', () => {
    const t = computeTotals(buildLines({ coalho: 1 }, catalog), 'pickup', 800)
    expect(t.deliveryFeeCents).toBe(0)
    expect(t.totalCents).toBe(3290)
  })
  it('sacola vazia não cobra taxa', () => {
    expect(computeTotals([], 'delivery', 800).totalCents).toBe(0)
  })
  it('ignora quantidade zero e produto que saiu do catálogo', () => {
    expect(buildLines({ coalho: 0, sumiu: 3, farinha: 1 }, catalog).map((l) => l.product.id)).toEqual(['farinha'])
  })
  it('singular e plural', () => {
    expect(itemsLabel(1)).toBe('1 item')
    expect(itemsLabel(3)).toBe('3 itens')
  })
})
