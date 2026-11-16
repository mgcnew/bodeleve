import { describe, expect, it } from 'vitest'
import type { Lot, StockMovement } from './inventory'
import {
  addPart, assertPaid, cashDifference, cashNetOf, cashSuggestions, changeOf, discountCents, expectedCash, lineTotal, missingOf, nextSaleId, PosError,
  pickLots, priceLine, refundText, sessionTotals, singlePayment, totalOf, validateMovement, withDiscount, type CashSession, type PosSale, type SaleLine,
} from './pos'

const money = (c: number) => `R$ ${(c / 100).toFixed(2).replace('.', ',')}`
const info = { name: 'Queijo coalho', unit: '500 g', priceCents: 3290, weightPriceCents: null }
const carne = { name: 'Carne de sol', unit: '500 g', priceCents: 3490, weightPriceCents: 5990 }

describe('linhas e totais da sacola', () => {
  it('unidade: quantidade × preço; peso: kg × preço do kg arredondado ao centavo', () => {
    expect(priceLine({ key: 'a', itemId: 'queijo-coalho', kind: 'unit', qty: 2 }, info)).toMatchObject({ totalCents: 6580, stockUnits: 2 })
    expect(priceLine({ key: 'b', itemId: 'carne-de-sol', kind: 'weight', qty: 0.5 }, carne)).toMatchObject({ totalCents: 2995, stockUnits: 1, unitPriceCents: 5990 })
    expect(lineTotal('weight', 0.75, 1690)).toBe(1268) // 12,675 → 12,68, como no quadro
  })

  it('recusa produto desconhecido, peso sem preço por kg e quantidade inválida', () => {
    expect(() => priceLine({ key: 'a', itemId: 'x', kind: 'unit', qty: 1 }, undefined)).toThrowError('unknown_product')
    expect(() => priceLine({ key: 'a', itemId: 'x', kind: 'weight', qty: 1 }, info)).toThrowError('unknown_product')
    expect(() => priceLine({ key: 'a', itemId: 'x', kind: 'unit', qty: 0 }, info)).toThrowError('invalid_qty')
    expect(() => priceLine({ key: 'a', itemId: 'x', kind: 'unit', qty: 1.5 }, info)).toThrowError('invalid_qty')
  })

  it('o quadro da sacola: 2 coalho + 0,5 kg de carne + 1 farinha = R$ 108,65', () => {
    const lines: SaleLine[] = [
      priceLine({ key: 'a', itemId: 'c', kind: 'unit', qty: 2 }, info),
      priceLine({ key: 'b', itemId: 'cs', kind: 'weight', qty: 0.5 }, carne),
      priceLine({ key: 'c', itemId: 'f', kind: 'unit', qty: 1 }, { ...info, name: 'Farinha', priceCents: 1290 }),
    ]
    expect(totalOf(lines, null)).toBe(10865)
  })
})

describe('desconto', () => {
  it('5%, 10%, R$ 5,00 e arredondar, sobre o subtotal de R$ 108,65', () => {
    expect(discountCents('p5', 10865)).toBe(543)
    expect(discountCents('p10', 10865)).toBe(1087)
    expect(discountCents('f500', 10865)).toBe(500)
    expect(discountCents('round', 10865)).toBe(65)
  })

  it('nunca passa do subtotal; arredondar em valor redondo não dá desconto', () => {
    expect(discountCents('f500', 300)).toBe(300)
    expect(withDiscount('round', 'Arredondamento', 10000)).toBeNull()
    expect(withDiscount('p10', 'Cliente da casa', 10865)).toEqual({ kind: 'p10', cents: 1087, reason: 'Cliente da casa' })
    expect(totalOf([{ totalCents: 10865 }], { cents: 65 })).toBe(10800)
  })
})

describe('pagamento', () => {
  it('atalhos de dinheiro para R$ 108,65: R$ 110, R$ 120 e R$ 150', () => {
    expect(cashSuggestions(10865)).toEqual([11000, 12000, 15000])
    expect(cashSuggestions(4000)).toEqual([5000, 6000, 10000])
    expect(cashSuggestions(2950)).toEqual([3000, 4000, 5000])
  })

  it('dinheiro: troco = entregue − total; menos que o total é recusado', () => {
    const p = singlePayment('cash', 10865, 12000)
    expect(p).toEqual([{ method: 'cash', cents: 10865, receivedCents: 12000 }])
    expect(changeOf(p)).toBe(1135)
    expect(cashNetOf(p)).toBe(10865)
    expect(singlePayment('cash', 10865)[0].receivedCents).toBe(10865)
    expect(() => singlePayment('cash', 10865, 10000)).toThrowError('invalid_payment')
    expect(changeOf(singlePayment('pix', 10865))).toBe(0)
  })

  it('combinado: R$ 50 em dinheiro e o resto no Pix; passar do que falta fica só o que falta', () => {
    let parts = addPart([], 'cash', 5000, 10865)
    expect(missingOf(10865, parts)).toBe(5865)
    parts = addPart(parts, 'pix', 99999, 10865)
    expect(parts[1].cents).toBe(5865)
    expect(missingOf(10865, parts)).toBe(0)
    expect(() => addPart(parts, 'debit', 100, 10865)).toThrowError('invalid_amount')
    expect(() => addPart([], 'debit', 0, 10865)).toThrowError('invalid_amount')
    expect(() => assertPaid(10865, parts)).not.toThrow()
    expect(() => assertPaid(10865, parts.slice(0, 1))).toThrowError(PosError)
  })

  it('reembolso diz por onde devolver', () => {
    expect(refundText({ totalCents: 3548, payments: [{ method: 'pix', cents: 3548 }] }, money)).toBe('Devolva R$ 35,48 por Pix a quem comprou.')
    expect(refundText({ totalCents: 10865, payments: [{ method: 'cash', cents: 5000 }, { method: 'credit', cents: 5865 }] }, money)).toBe('Devolva R$ 50,00 em dinheiro e R$ 58,65 no crédito a quem comprou.')
  })

  it('número da venda segue o maior já usado', () => {
    expect(nextSaleId(['V-0212', 'V-0207', 'V-0211'])).toBe('V-0213')
    expect(nextSaleId([])).toBe('V-0001')
  })
})

describe('estoque da venda', () => {
  const lot = (id: string, itemId: string, expiresAt: string | null, receivedAt: string): Lot => ({ id, itemId, code: id.toUpperCase(), expiresAt, unitCostCents: 100, receivedAt, source: 'x' })
  const mv = (id: string, lotId: string, qty: number): StockMovement => ({ id, itemId: 'q', lotId, type: 'purchase_in', qty, at: '2026-11-01T10:00:00Z', ref: 'x' })

  it('sai do lote que vence primeiro e passa para o próximo quando acaba', () => {
    const lots = [lot('b', 'q', '2026-12-10T00:00:00Z', '2026-11-02T00:00:00Z'), lot('a', 'q', '2026-11-20T00:00:00Z', '2026-11-01T00:00:00Z')]
    const moves = [mv('1', 'a', 2), mv('2', 'b', 5)]
    expect(pickLots(lots, moves, 'q', 1).map((p) => [p.lot.id, p.qty])).toEqual([['a', 1]])
    expect(pickLots(lots, moves, 'q', 3.5).map((p) => [p.lot.id, p.qty])).toEqual([['a', 2], ['b', 1.5]])
    expect(() => pickLots(lots, moves, 'q', 7.5)).toThrowError('insufficient_stock')
  })
})

describe('caixa', () => {
  const session: CashSession = {
    id: 'cx-1', openedAt: '2026-11-14T08:02:00Z', openedBy: 'Júlia', openingCents: 15000,
    baseline: { count: 20, cashCents: 20430, pixCents: 10092, cardCents: 25340 },
    movements: [{ id: 'm1', at: '2026-11-14T10:00:00Z', kind: 'sangria', cents: 5000, reason: 'Troco para entregador', by: 'Júlia' }],
    status: 'open', closedAt: null, closedBy: null, countedCents: null, expectedCents: null,
  }
  const sale = (o: Partial<PosSale> & { id: string }): PosSale => ({
    sessionId: 'cx-1', at: '2026-11-14T15:00:00Z', by: 'Júlia', lines: [], subtotalCents: 0, discount: null, totalCents: 0, payments: [], changeCents: 0, status: 'completed', cancel: null, movementIds: [], ...o,
  })
  const sales = [
    sale({ id: 'V-0210', totalCents: 8030, payments: [{ method: 'cash', cents: 8030, receivedCents: 10000 }] }),
    sale({ id: 'V-0208', totalCents: 2740, payments: [{ method: 'cash', cents: 2740 }] }),
    sale({ id: 'V-0212', totalCents: 3548, payments: [{ method: 'pix', cents: 3548 }] }),
    sale({ id: 'V-0211', totalCents: 3290, payments: [{ method: 'debit', cents: 3290 }] }),
    sale({ id: 'V-0209', totalCents: 9610, payments: [{ method: 'credit', cents: 9610 }] }),
    sale({ id: 'V-0207', totalCents: 6120, payments: [{ method: 'pix', cents: 6120 }], sessionId: 'outro' }),
  ]

  it('totais: a base mais as vendas da sessão; débito e crédito juntos em cartão', () => {
    expect(sessionTotals(session, sales)).toEqual({ count: 25, cashCents: 20430 + 8030 + 2740, pixCents: 10092 + 3548, cardCents: 25340 + 3290 + 9610, totalCents: 20430 + 10770 + 10092 + 3548 + 25340 + 12900 })
  })

  it('esperado na gaveta = abertura + dinheiro das vendas + suprimentos − sangrias', () => {
    expect(expectedCash(session, sales)).toBe(15000 + 20430 + 10770 - 5000)
  })

  it('venda cancelada sai dos totais e da gaveta', () => {
    const withCancel = sales.map((s) => (s.id === 'V-0210' ? { ...s, status: 'cancelled' as const } : s))
    expect(expectedCash(session, withCancel)).toBe(15000 + 20430 + 2740 - 5000)
    expect(sessionTotals(session, withCancel).count).toBe(24)
  })

  it('diferença = contado − esperado; sangria maior que a gaveta é recusada', () => {
    expect(cashDifference(41195, 41200)).toBe(-5)
    expect(cashDifference(41200, 41200)).toBe(0)
    expect(() => validateMovement('sangria', 99999, 41200)).toThrowError('invalid_amount')
    expect(() => validateMovement('suprimento', 99999, 0)).not.toThrow()
    expect(() => validateMovement('suprimento', 0, 100)).toThrowError('invalid_amount')
  })
})
