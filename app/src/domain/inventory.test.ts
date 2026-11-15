import { describe, expect, it } from 'vitest'
import { daysUntil, itemBalance, levelOf, lotBalance, lotsFefo, nextLot, type Lot, type StockMovement } from './inventory'
import { parseBrDate, suggestQty, validateReceipt, formatBrDate, type PurchaseOrder } from './purchasing'
import type { StockItem } from './inventory'

const lot = (id: string, itemId: string, expiresAt: string | null, receivedAt = '2026-11-01'): Lot => ({ id, itemId, code: id.toUpperCase(), expiresAt, unitCostCents: 100, receivedAt, source: 'x' })
const mv = (id: string, itemId: string, lotId: string | null, qty: number): StockMovement => ({ id, itemId, lotId, type: 'inventory', qty, at: '2026-11-01', ref: 'x' })

describe('saldo vem das movimentações', () => {
  const movements = [mv('1', 'q', 'a', 8), mv('2', 'q', 'b', 10), mv('3', 'q', 'a', -3), mv('4', 'o', 'c', 5)]
  it('soma por item e por lote', () => {
    expect(itemBalance(movements, 'q')).toBe(15)
    expect(lotBalance(movements, 'a')).toBe(5)
  })
  it('saída segue o lote que vence primeiro; sem validade vai por último (H-G11)', () => {
    const lots = [lot('b', 'q', '2026-12-02'), lot('a', 'q', '2026-11-19'), lot('n', 'q', null)]
    const m = [...movements, mv('5', 'q', 'n', 4)]
    expect(lotsFefo(lots, m, 'q').map((l) => l.id)).toEqual(['a', 'b', 'n'])
    expect(nextLot(lots, m, 'q')?.id).toBe('a')
  })
  it('lote zerado sai da fila', () => {
    const lots = [lot('a', 'q', '2026-11-19'), lot('b', 'q', '2026-12-02')]
    const m = [mv('1', 'q', 'a', 2), mv('2', 'q', 'a', -2), mv('3', 'q', 'b', 5)]
    expect(nextLot(lots, m, 'q')?.id).toBe('b')
  })
})

describe('nível de estoque', () => {
  it('ok, baixo e sem estoque', () => {
    expect(levelOf(18, 12)).toBe('ok')
    expect(levelOf(4, 12)).toBe('low')
    expect(levelOf(6, 6)).toBe('low') // "Estoque 6 un · mínimo 6" é baixo no quadro
    expect(levelOf(0, 12)).toBe('out')
  })
})

describe('datas', () => {
  const now = new Date('2026-11-14T15:30:00')
  it('dias até vencer', () => {
    expect(daysUntil('2026-11-19T12:00:00', now)).toBe(5)
    expect(daysUntil('2026-11-10T12:00:00', now)).toBe(-4)
  })
  it('lê dd/mm/aaaa e rejeita data que não existe', () => {
    expect(formatBrDate(parseBrDate('21/11/2026'))).toBe('21/11/2026')
    expect(parseBrDate('31/02/2027')).toBeNull()
    expect(parseBrDate('2027-02-01')).toBeNull()
  })
})

describe('sugestão de compra pelo estoque mínimo (H-G7)', () => {
  it('repõe até o dobro do mínimo', () => {
    expect(suggestQty(4, 12)).toBe(20)
    expect(suggestQty(6, 6)).toBe(6) // melaço do quadro: 6 un
    expect(suggestQty(10, 8)).toBe(0) // açúcar do quadro: estoque ok, nada a repor
    expect(suggestQty(10, 12)).toBe(14)
  })
})

describe('validação do recebimento', () => {
  const item = (id: string, tracksExpiry: boolean): StockItem => ({ id, name: id, unit: '1 un', itemType: 'resale', origin: 'resale', categoryId: 'c', minStock: 1, tracksExpiry, supplierId: null, lastCostCents: 100 })
  const order: PurchaseOrder = {
    id: 'PC-1', supplierId: 's', status: 'sent', createdAt: '', sentAt: null, expectedAt: '', receivedAt: null, payment: 'boleto14', closedShort: false, sentVia: 'whatsapp',
    items: [{ itemId: 'leite', name: 'Leite', qty: 10, unitCostCents: 300, receivedQty: 0 }],
  }
  it('exige lote e, se o item vence, validade', () => {
    const e = validateReceipt(order, [{ itemId: 'leite', qty: 10, lot: '', expiresAt: null }], [item('leite', true)])
    expect(e.leite).toEqual({ lot: 'Informe o lote como está na embalagem.', expiresAt: 'Informe a validade como está na embalagem.' })
  })
  it('quantidade zero não exige lote (item que não chegou)', () => {
    expect(validateReceipt(order, [{ itemId: 'leite', qty: 0, lot: '', expiresAt: null }], [item('leite', true)])).toEqual({})
  })
  it('recusa quantidade negativa', () => {
    expect(validateReceipt(order, [{ itemId: 'leite', qty: -2, lot: 'L', expiresAt: null }], [item('leite', false)]).leite.qty).toMatch(/igual ou maior que zero/)
  })
})
