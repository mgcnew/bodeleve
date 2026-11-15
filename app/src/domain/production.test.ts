import { describe, expect, it } from 'vitest'
import { itemBalance, itemLabel, lotBalance, type StockItem } from './inventory'
import { batchCostCents, checkInputs, finishOrder, formatContent, marginPercent, needs, nextOrderId, ProductionError, suggestLotCode, undoFinish, unitCostCents, type ProductionOrder } from './production'
import { buildProductionSeed, buildPurchaseSeed, buildStockSeed, recipesSeed } from '@/mocks/stockSeed'
import { products } from '@/mocks/seed'
import { incomingByItem } from './stock'

const now = new Date('2026-11-14T15:30:00')
const stock = () => buildStockSeed(now)
const recipe = (id: string) => recipesSeed.find((r) => r.id === id)!
const costOf = (items: StockItem[]) => (id: string) => items.find((i) => i.id === id)!.lastCostCents ?? 0
const price = (id: string) => products.find((p) => p.id === id)!.priceCents

describe('ficha técnica: custos e margens dos quadros', () => {
  const { items } = stock()
  it.each([
    ['ficha-queijo-coalho', 1420, 57],
    ['ficha-queijo-manteiga', 1680, 54],
    ['ficha-doce-de-leite', 790, 58],
    ['ficha-manteiga-de-garrafa', 1500, 46],
  ])('%s: custo por unidade %i centavos e margem %i%%', (id, unit, margin) => {
    const r = recipe(id)
    expect(unitCostCents(r, costOf(items))).toBe(unit)
    expect(marginPercent(price(r.itemId), unit)).toBe(margin)
  })
  it('fornada de queijo coalho: R$ 142,00 (leite 124 + coalho 5 + sal 2 + embalagem 8 + gás e energia 3)', () => {
    expect(batchCostCents(recipe('ficha-queijo-coalho'), costOf(items))).toBe(14200)
  })
  it('quantidades na unidade que a pessoa conhece', () => {
    const coalho = items.find((i) => i.id === 'coalho-liquido')!
    const sal = items.find((i) => i.id === 'sal')!
    const emb = items.find((i) => i.id === 'embalagem-vacuo')!
    expect(formatContent(0.4, coalho)).toBe('20 ml')
    expect(formatContent(0.5, sal)).toBe('0,5 kg')
    expect(formatContent(10, emb)).toBe('10 un')
    expect(itemLabel(emb)).toBe('Embalagem a vácuo')
  })
  it('necessidade por número de fornadas', () => {
    expect(needs(recipe('ficha-queijo-coalho'), 2).map((n) => [n.itemId, n.qty])).toEqual([['leite-integral', 80], ['coalho-liquido', 0.8], ['sal', 1], ['embalagem-vacuo', 20]])
  })
})

describe('conferência de insumos (H-G17)', () => {
  const s = stock()
  const have = (id: string) => itemBalance(s.movements, id)
  const incoming = incomingByItem(buildPurchaseSeed(now), now)
  const today = (id: string) => incoming.get(id)?.today ?? 0
  it('2 fornadas: falta leite (precisa 80, tem 18) e ele chega hoje no PC-0057 (140): a ordem pode ser criada', () => {
    const c = checkInputs(recipe('ficha-queijo-coalho'), 2, have, today)
    const leite = c.lines.find((l) => l.itemId === 'leite-integral')!
    expect([leite.need, leite.have, leite.missing, leite.incomingToday]).toEqual([80, 18, 62, 140])
    expect(c.missingAny).toBe(true)
    expect(c.coveredByIncoming).toBe(true)
    // coalho líquido: 40 ml = 0,8 un de 1 un em estoque: tem
    expect(c.lines.find((l) => l.itemId === 'coalho-liquido')!.missing).toBe(0)
  })
  it('1 fornada: leite 40 > 18 também falta', () => {
    expect(checkInputs(recipe('ficha-queijo-coalho'), 1, have, today).lines[0].missing).toBe(22)
  })
  it('falta sem compra a caminho: não é coberta (a ordem fica planejada)', () => {
    const c = checkInputs(recipe('ficha-doce-de-leite'), 3, have, () => 0)
    expect(c.missingAny).toBe(true)
    expect(c.coveredByIncoming).toBe(false)
  })
})

describe('apontamento da ordem OP-0032 (quadro Ordem)', () => {
  const setup = () => {
    const s = stock()
    // O leite que falta só chega com a compra: sem isso a ordem não pode ser concluída.
    s.lots.push({ id: 'lot-pc57', itemId: 'leite-integral', code: 'LT-1120', expiresAt: '2026-12-05T12:00:00', unitCostCents: 310, receivedAt: now.toISOString(), source: 'PC-0057' })
    s.movements.push({ id: 'mv-x', itemId: 'leite-integral', lotId: 'lot-pc57', type: 'purchase_in', qty: 140, at: now.toISOString(), ref: 'PC-0057' })
    const order = buildProductionSeed(now).find((o) => o.id === 'OP-0032')!
    return { s, order }
  }
  const consumption = (milk = 80, coalhoMl = 40, salKg = 1, emb = 20) => [
    { itemId: 'leite-integral', qty: milk },
    { itemId: 'coalho-liquido', qty: coalhoMl / 50 },
    { itemId: 'sal', qty: salKg },
    { itemId: 'embalagem-vacuo', qty: emb },
  ]
  it('19 un boas e consumo como previsto: custo real R$ 14,95 por unidade; entra o lote e saem os insumos', () => {
    const { s, order } = setup()
    const r = finishOrder(s, order, recipe('ficha-queijo-coalho'), { consumption: consumption(), goodQty: 19, lotCode: 'QC-1113', expiresAt: '2026-12-04T12:00:00' }, now)
    expect(r.order.status).toBe('done')
    expect(r.order.costPerUnitCents).toBe(1495) // (248 + 10 + 4 + 16 + 6) / 19 = R$ 14,947
    expect(itemBalance(s.movements, 'queijo-coalho')).toBe(18 + 19)
    expect(itemBalance(s.movements, 'leite-integral')).toBe(18 + 140 - 80)
    expect(itemBalance(s.movements, 'sal')).toBe(2)
    expect(lotBalance(s.movements, r.order.lotId!)).toBe(19)
    expect(r.entered.description).toBe('Produção · OP-0032 · Entrada do lote QC-1113')
    // perda na produção = previsto − boas
    expect(order.plannedQty - 19).toBe(1)
  })
  it('consumo maior que o previsto encarece a unidade', () => {
    const { s, order } = setup()
    const r = finishOrder(s, order, recipe('ficha-queijo-coalho'), { consumption: consumption(90), goodQty: 19, lotCode: 'QC-1113', expiresAt: null }, now)
    expect(r.order.costPerUnitCents).toBeGreaterThan(1495)
  })
  it('sem leite suficiente no estoque nada é lançado (o PC-0057 ainda não foi recebido)', () => {
    const s = stock()
    const order = buildProductionSeed(now).find((o) => o.id === 'OP-0032')!
    const moves = s.movements.length
    expect(() => finishOrder(s, order, recipe('ficha-queijo-coalho'), { consumption: consumption(), goodQty: 19, lotCode: 'QC-1113', expiresAt: null }, now)).toThrow(ProductionError)
    expect(s.movements).toHaveLength(moves)
    expect(s.lots.some((l) => l.code === 'QC-1113')).toBe(false)
  })
  it('baixa dos insumos segue o lote que vence primeiro', () => {
    const { s, order } = setup()
    finishOrder(s, order, recipe('ficha-queijo-coalho'), { consumption: consumption(), goodQty: 20, lotCode: 'QC-1113', expiresAt: null }, now)
    // o lote antigo (18 L) é usado inteiro antes do lote novo
    expect(lotBalance(s.movements, 'lot-leite-integral-1')).toBe(0)
  })
  it('exige o lote; só conclui ordem em produção', () => {
    const { s, order } = setup()
    expect(() => finishOrder(s, order, recipe('ficha-queijo-coalho'), { consumption: [], goodQty: 1, lotCode: ' ', expiresAt: null }, now)).toThrowError('invalid_input')
    const planned = buildProductionSeed(now).find((o) => o.id === 'OP-0034')!
    expect(() => finishOrder(s, planned, recipe('ficha-queijo-manteiga'), { consumption: [], goodQty: 1, lotCode: 'QM-1', expiresAt: null }, now)).toThrowError('invalid_state')
  })
  it('corrigir apontamento devolve os insumos e tira o lote', () => {
    const { s, order } = setup()
    const before = JSON.stringify(s.movements)
    const done = finishOrder(s, order, recipe('ficha-queijo-coalho'), { consumption: consumption(), goodQty: 19, lotCode: 'QC-1113', expiresAt: null }, now).order
    const back = undoFinish(s, done)
    expect(back.status).toBe('in_progress')
    expect(JSON.stringify(s.movements)).toBe(before)
    expect(s.lots.some((l) => l.code === 'QC-1113')).toBe(false)
  })
  it('não corrige se o lote acabado já teve saída', () => {
    const { s, order } = setup()
    const done = finishOrder(s, order, recipe('ficha-queijo-coalho'), { consumption: consumption(), goodQty: 19, lotCode: 'QC-1113', expiresAt: null }, now).order
    s.movements.push({ id: 'mv-sale', itemId: 'queijo-coalho', lotId: done.lotId, type: 'sale_out', qty: -2, at: now.toISOString(), ref: 'V-1' })
    expect(() => undoFinish(s, done)).toThrowError('cannot_reverse')
  })
})

describe('ordens de exemplo e numeração', () => {
  const orders = buildProductionSeed(now)
  it('duas em produção, duas planejadas e duas concluídas, como no quadro', () => {
    const count = (st: ProductionOrder['status']) => orders.filter((o) => o.status === st).length
    expect([count('in_progress'), count('planned'), count('done')]).toEqual([2, 2, 2])
  })
  it('próxima ordem é OP-0036', () => {
    expect(nextOrderId(orders.map((o) => o.id))).toBe('OP-0036')
  })
  it('sugere o próximo código de lote do produto', () => {
    expect(suggestLotCode('QC', stock().lots)).toBe('QC-1113')
    expect(suggestLotCode('ZZ', [])).toBe('ZZ-1001')
  })
  it('o em produção entra no projetado: queijo coalho 12 + 20 = 32', () => {
    const inProd = orders.filter((o) => o.status === 'in_progress' && o.itemId === 'queijo-coalho').reduce((a, o) => a + o.plannedQty, 0)
    expect(inProd).toBe(20)
  })
})
