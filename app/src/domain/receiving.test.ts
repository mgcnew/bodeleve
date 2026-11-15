import { describe, expect, it } from 'vitest'
import { itemBalance, lotBalance } from './inventory'
import { orderTotal, receivedTotal } from './purchasing'
import { closeShortOrder, receive, reverseLastReceipt, ReceivingError, type ReceivingState } from './receiving'
import { buildPurchaseSeed, buildStockSeed, suppliersSeed } from '@/mocks/stockSeed'

const now = new Date('2026-11-14T15:30:00')
const fresh = (): ReceivingState & { items: ReturnType<typeof buildStockSeed>['items'] } => {
  const s = buildStockSeed(now)
  return { purchaseOrders: buildPurchaseSeed(now), lots: s.lots, movements: s.movements, entries: [], receipts: [], items: s.items }
}
const supplier = suppliersSeed.find((s) => s.id === 'serra')!.name
const lines = (leite: number, req: number, nata: number) => [
  { itemId: 'leite-integral', qty: leite, lot: 'LT-1120', expiresAt: new Date(2026, 10, 21, 12).toISOString() },
  { itemId: 'requeijao', qty: req, lot: 'RQ-1118', expiresAt: new Date(2026, 11, 20, 12).toISOString() },
  { itemId: 'nata', qty: nata, lot: 'NT-1114', expiresAt: new Date(2026, 10, 24, 12).toISOString() },
]

describe('pedidos de exemplo fecham com os quadros', () => {
  it.each([['PC-0057', 63240], ['PC-0056', 48600], ['PC-0055', 71800], ['PC-0054', 51200], ['PC-0049', 23640], ['PC-0038', 31200]])('%s = %i', (id, total) => {
    const o = buildPurchaseSeed(now).find((x) => x.id === id)!
    expect(orderTotal(o)).toBe(total)
  })
  it('PC-0053, recebido parcial, mostra o que chegou: R$ 420,00', () => {
    expect(receivedTotal(buildPurchaseSeed(now).find((x) => x.id === 'PC-0053')!)).toBe(42000)
  })
})

describe('receber PC-0057 (quadro Recebimento)', () => {
  it('tudo completo: dá entrada nos lotes, fecha o pedido e cria a conta de R$ 632,40 com vencimento em 14 dias', () => {
    const st = fresh()
    const before = itemBalance(st.movements, 'leite-integral')
    const r = receive(st, 'PC-0057', lines(140, 20, 12), { closeShort: false, now, supplierName: supplier, items: st.items })
    expect(r.order.status).toBe('received')
    expect(r.shortfall).toEqual([])
    expect(itemBalance(st.movements, 'leite-integral')).toBe(before + 140)
    expect(r.payable?.amountCents).toBe(63240)
    expect(r.payable?.description).toBe('Laticínios Serra Verde · boleto')
    expect(new Date(r.payable!.dueAt).getDate()).toBe(28) // 14/11 + 14 dias = 28/11
    expect(st.entries).toHaveLength(1)
  })
  it('recebimento parcial (nata 10 de 12): valor da nota é o do que chegou e o restante pode ficar em aberto', () => {
    const st = fresh()
    const r = receive(st, 'PC-0057', lines(140, 20, 10), { closeShort: false, now, supplierName: supplier, items: st.items })
    expect(r.payable?.amountCents).toBe(43400 + 13600 + 5200) // R$ 622,00
    expect(r.shortfall).toEqual([{ itemId: 'nata', name: 'Nata 200 g', missing: 2 }])
    expect(r.order.status).toBe('partially_received')
    // segundo recebimento completa o pedido
    const r2 = receive(st, 'PC-0057', [{ itemId: 'nata', qty: 2, lot: 'NT-1115', expiresAt: new Date(2026, 10, 25, 12).toISOString() }], { closeShort: false, now, supplierName: supplier, items: st.items })
    expect(r2.order.status).toBe('received')
    expect(r2.payable?.amountCents).toBe(1040)
  })
  it('encerrar com falta marca "Recebido parcial"', () => {
    const st = fresh()
    const r = receive(st, 'PC-0057', lines(140, 20, 10), { closeShort: true, now, supplierName: supplier, items: st.items })
    expect(r.order.status).toBe('received')
    expect(r.order.closedShort).toBe(true)
  })
  it('exige lote e validade; não altera nada se der erro', () => {
    const st = fresh()
    const snapshot = JSON.stringify(st.movements)
    const bad = lines(140, 20, 12).map((l) => (l.itemId === 'nata' ? { ...l, lot: '', expiresAt: null } : l))
    expect(() => receive(st, 'PC-0057', bad, { closeShort: false, now, supplierName: supplier, items: st.items })).toThrow(ReceivingError)
    expect(JSON.stringify(st.movements)).toBe(snapshot)
    expect(st.purchaseOrders.find((o) => o.id === 'PC-0057')!.status).toBe('sent')
  })
  it('não recebe duas vezes um pedido já recebido', () => {
    const st = fresh()
    expect(() => receive(st, 'PC-0054', [], { closeShort: false, now, supplierName: 'x', items: st.items })).toThrowError('invalid_state')
  })
  it('mesmo lote recebido de novo soma no lote existente', () => {
    const st = fresh()
    receive(st, 'PC-0057', lines(100, 0, 0), { closeShort: false, now, supplierName: supplier, items: st.items })
    receive(st, 'PC-0057', lines(40, 0, 0), { closeShort: false, now, supplierName: supplier, items: st.items })
    const lot = st.lots.find((l) => l.code === 'LT-1120')!
    expect(lotBalance(st.movements, lot.id)).toBe(140)
    expect(st.lots.filter((l) => l.code === 'LT-1120')).toHaveLength(1)
  })
})

describe('encerrar com falta depois de confirmar', () => {
  it('pedido em aberto com falta vira "Recebido parcial"', () => {
    const st = fresh()
    receive(st, 'PC-0057', lines(140, 20, 10), { closeShort: false, now, supplierName: supplier, items: st.items })
    const o = closeShortOrder(st, 'PC-0057', now)
    expect(o.status).toBe('received')
    expect(o.closedShort).toBe(true)
    // corrigir a conferência ainda restaura o pedido como estava antes do recebimento
    expect(reverseLastReceipt(st, 'PC-0057').status).toBe('sent')
  })
})

describe('corrigir conferência', () => {
  it('desfaz entrada, lotes e conta; o pedido volta a "enviado"', () => {
    const st = fresh()
    const movs = st.movements.length
    receive(st, 'PC-0057', lines(140, 20, 12), { closeShort: false, now, supplierName: supplier, items: st.items })
    const o = reverseLastReceipt(st, 'PC-0057')
    expect(o.status).toBe('sent')
    expect(o.items.every((i) => i.receivedQty === 0)).toBe(true)
    expect(st.movements).toHaveLength(movs)
    expect(st.entries).toHaveLength(0)
  })
  it('não corrige se a conta já foi paga', () => {
    const st = fresh()
    receive(st, 'PC-0057', lines(140, 20, 12), { closeShort: false, now, supplierName: supplier, items: st.items })
    st.entries[0].paidAt = now.toISOString()
    expect(() => reverseLastReceipt(st, 'PC-0057')).toThrowError('cannot_reverse')
  })
  it('não corrige se já saiu mercadoria do lote', () => {
    const st = fresh()
    receive(st, 'PC-0057', lines(140, 20, 12), { closeShort: false, now, supplierName: supplier, items: st.items })
    const lot = st.lots.find((l) => l.code === 'LT-1120')!
    st.movements.push({ id: 'mv-x', itemId: 'leite-integral', lotId: lot.id, type: 'production_out', qty: -10, at: now.toISOString(), ref: 'OP-1' })
    expect(() => reverseLastReceipt(st, 'PC-0057')).toThrowError('cannot_reverse')
  })
})
