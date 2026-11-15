import { describe, expect, it } from 'vitest'
import { itemBalance, lotBalance, nextLot } from './inventory'
import { adjust, applyCount, buildRows, compactMoney, expiringLots, lowRows, reverse, StockError, stockValueCents, undoCount, type StockState } from './stock'
import { buildSeedOrders } from '@/mocks/seedOrders'
import { buildPurchaseSeed, buildStockSeed, reservationsSeed } from '@/mocks/stockSeed'

const now = new Date('2026-11-14T15:30:00')
const fresh = (): StockState => {
  const s = buildStockSeed(now)
  return { stockItems: s.items, lots: s.lots, movements: s.movements, orders: buildSeedOrders(now), reservations: structuredClone(reservationsSeed), purchaseOrders: buildPurchaseSeed(now) }
}
const row = (st: StockState, id: string) => buildRows(st, now).find((r) => r.itemId === id)!

describe('queijo coalho bate com os quadros Estoque, Item e Movimentações', () => {
  const st = fresh()
  it('físico 18, reservado 6, disponível 12, mínimo 15 → baixo', () => {
    const r = row(st, 'queijo-coalho')
    expect([r.physical, r.reserved, r.available, r.min, r.level]).toEqual([18, 6, 12, 15, 'low'])
  })
  it('lotes: QC-1107 com 8 (vence primeiro) e QC-1112 com 10', () => {
    expect(lotBalance(st.movements, 'lot-queijo-coalho-1')).toBe(8)
    expect(lotBalance(st.movements, 'lot-queijo-coalho-2')).toBe(10)
    expect(nextLot(st.lots, st.movements, 'queijo-coalho')?.code).toBe('QC-1107')
  })
  it('a lista de movimentações reproduz os saldos do quadro: 15 → 12 → 11 → 21 → 20 → 18', () => {
    const mv = st.movements.filter((m) => m.itemId === 'queijo-coalho').sort((a, b) => a.at.localeCompare(b.at))
    let saldo = 0
    const chain = mv.map((m) => (saldo += m.qty))
    expect(chain).toEqual([15, 12, 11, 21, 20, 18])
    expect(itemBalance(st.movements, 'queijo-coalho')).toBe(18)
  })
  it('reservado: 3 pedidos online em aberto + 3 de reserva manual', () => {
    const r = row(st, 'queijo-coalho')
    expect(r.reserved).toBe(6)
    const orders = st.orders.filter((o) => ['received', 'preparing', 'ready_for_pickup', 'ready_for_delivery'].includes(o.status) && o.items.some((i) => i.productId === 'queijo-coalho'))
    expect(orders).toHaveLength(3)
  })
})

describe('visão geral: 7 itens baixos e 3 vencendo, como no quadro', () => {
  const st = fresh()
  const rows = buildRows(st, now)
  it('baixos', () => {
    expect(lowRows(rows).map((r) => r.itemId).sort()).toEqual(['coalho-liquido', 'leite-integral', 'melaco-de-cana', 'nata', 'queijo-coalho', 'rapadura', 'tapioca-granulada'].sort())
  })
  it('vencendo em até 7 dias: coalho, nata e doce de leite', () => {
    expect(expiringLots(st.lots, st.movements, st.stockItems, now).map((x) => x.item.id).sort()).toEqual(['doce-de-leite', 'nata', 'queijo-coalho'])
    expect(rows.filter((r) => r.expiringSoon).map((r) => r.itemId).sort()).toEqual(['doce-de-leite', 'nata', 'queijo-coalho'])
  })
  it('leite: 140 chegam hoje (PC-0057) e entram no projetado', () => {
    const r = rows.find((x) => x.itemId === 'leite-integral')!
    expect(r.incomingToday).toBe(140)
    expect(r.projected).toBe(r.available + 140)
  })
  it('itens que não são baixos', () => {
    for (const id of ['doce-de-leite', 'farinha-de-mandioca', 'manteiga-de-garrafa', 'carne-de-sol']) expect(rows.find((r) => r.itemId === id)!.level).toBe('ok')
  })
  it('valor do estoque é a soma de saldo × custo de cada lote', () => {
    expect(stockValueCents(st)).toBeGreaterThan(0)
    expect(compactMoney(840000)).toBe('R$ 8,4 mil')
    expect(compactMoney(45050)).toBe('R$ 450,50')
  })
})

describe('perda e ajuste', () => {
  it('perda baixa o saldo do lote e guarda motivo e quem lançou', () => {
    const st = fresh()
    const m = adjust(st, { itemId: 'queijo-coalho', lotId: 'lot-queijo-coalho-1', qty: 1, kind: 'loss', reason: 'Embalagem danificada', by: 'Ana', now })
    expect(m.qty).toBe(-1)
    expect(m.type).toBe('loss')
    expect(m.description).toBe('Perda · embalagem danificada')
    expect(itemBalance(st.movements, 'queijo-coalho')).toBe(17)
  })
  it('não deixa o lote ficar negativo', () => {
    const st = fresh()
    expect(() => adjust(st, { itemId: 'queijo-coalho', lotId: 'lot-queijo-coalho-1', qty: 9, kind: 'loss', reason: '', by: 'Ana', now })).toThrowError('insufficient')
    expect(itemBalance(st.movements, 'queijo-coalho')).toBe(18)
  })
  it('correção pode somar ao estoque', () => {
    const st = fresh()
    adjust(st, { itemId: 'queijo-coalho', lotId: 'lot-queijo-coalho-2', qty: 2, kind: 'correction', reason: '', add: true, by: 'Ana', now })
    expect(itemBalance(st.movements, 'queijo-coalho')).toBe(20)
  })
  it('exige quantidade maior que zero', () => {
    expect(() => adjust(fresh(), { itemId: 'queijo-coalho', lotId: 'lot-queijo-coalho-1', qty: 0, kind: 'loss', reason: '', by: 'Ana', now })).toThrow(StockError)
  })
  it('desfazer lança um movimento contrário, não apaga o histórico, e só vale uma vez', () => {
    const st = fresh()
    const m = adjust(st, { itemId: 'queijo-coalho', lotId: 'lot-queijo-coalho-1', qty: 1, kind: 'loss', reason: 'Vencido', by: 'Ana', now })
    const count = st.movements.length
    const r = reverse(st, m.id, 'Ana', now)
    expect(r.qty).toBe(1)
    expect(st.movements).toHaveLength(count + 1)
    expect(itemBalance(st.movements, 'queijo-coalho')).toBe(18)
    expect(() => reverse(st, m.id, 'Ana', now)).toThrowError('cannot_reverse')
  })
})

describe('inventário (contagem)', () => {
  const lines = [{ itemId: 'queijo-coalho', counted: 17 }, { itemId: 'queijo-manteiga', counted: 9 }, { itemId: 'doce-de-leite', counted: 10 }]
  it('lança só a diferença: falta sai do lote que vence primeiro; resume unidades e custo', () => {
    const st = fresh()
    const r = applyCount(st, lines, 'Ana', now)
    expect(r.movements).toHaveLength(1)
    expect(r.movements[0]).toMatchObject({ itemId: 'queijo-coalho', lotId: 'lot-queijo-coalho-1', qty: -1 })
    expect(r.deltaUnits).toBe(-1)
    expect(r.deltaCostCents).toBe(-1420)
    expect(itemBalance(st.movements, 'queijo-coalho')).toBe(17)
  })
  it('sobra entra no lote mais recente', () => {
    const st = fresh()
    const r = applyCount(st, [{ itemId: 'queijo-coalho', counted: 20 }], 'Ana', now)
    expect(r.movements[0].lotId).toBe('lot-queijo-coalho-2')
    expect(itemBalance(st.movements, 'queijo-coalho')).toBe(20)
  })
  it('falta maior que um lote consome o próximo lote', () => {
    const st = fresh()
    applyCount(st, [{ itemId: 'queijo-coalho', counted: 6 }], 'Ana', now) // faltam 12: 8 do QC-1107 e 4 do QC-1112
    expect(lotBalance(st.movements, 'lot-queijo-coalho-1')).toBe(0)
    expect(lotBalance(st.movements, 'lot-queijo-coalho-2')).toBe(6)
  })
  it('tudo conferindo não lança nada', () => {
    const st = fresh()
    const count = st.movements.length
    const r = applyCount(st, [{ itemId: 'queijo-coalho', counted: 18 }], 'Ana', now)
    expect(r.movements).toHaveLength(0)
    expect(st.movements).toHaveLength(count)
  })
  it('corrigir contagem desfaz todos os lançamentos dela', () => {
    const st = fresh()
    const r = applyCount(st, [{ itemId: 'queijo-coalho', counted: 6 }], 'Ana', now)
    expect(undoCount(st, r.batchId, 'Ana', now)).toBe(2)
    expect(itemBalance(st.movements, 'queijo-coalho')).toBe(18)
  })
})
