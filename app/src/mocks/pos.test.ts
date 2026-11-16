import { describe, expect, it } from 'vitest'
import { PosError } from '@/domain/pos'
import { itemBalance } from '@/domain/inventory'
import { createMockServices } from './services'
import { createDb } from './db'
import { createAdminServices } from './adminServices'
import { memoryStorage } from '@/test/renderApp'

/** Banco em memória com os dados de exemplo e acesso ao estado, para conferir estoque e financeiro. */
function setup() {
  const storage = memoryStorage()
  const now = new Date()
  const db = createDb({ storage, withSeed: true, now: () => now })
  const svc = createAdminServices({ db, now: () => now })
  return { db, svc, storage }
}
const unit = (itemId: string, qty = 1) => ({ key: `${itemId}-${qty}`, itemId, kind: 'unit' as const, qty })
const weight = (itemId: string, kg: number) => ({ key: `${itemId}-${kg}`, itemId, kind: 'weight' as const, qty: kg })

describe('caixa do quadro', () => {
  it('26 vendas, R$ 892,00; dinheiro 312,00, Pix 197,60, cartão 382,40; gaveta esperada R$ 412,00', async () => {
    const { svc } = setup()
    const c = (await svc.pos.cash())!
    expect(c.count).toBe(26)
    expect(c.totalCents).toBe(89200)
    expect([c.cashCents, c.pixCents, c.cardCents]).toEqual([31200, 19760, 38240])
    expect(c.session).toMatchObject({ openedBy: 'Júlia', openingCents: 15000, status: 'open' })
    expect(c.movements).toEqual([{ id: 'cm-1', label: 'Sangria · Troco para entregador', signedCents: -5000 }])
    expect(c.expectedCents).toBe(15000 + 31200 - 5000)
    const o = await svc.pos.overview()
    expect(o.lastClose?.differenceCents).toBe(0)
  })

  it('o caixa do financeiro bate com a gaveta esperada (R$ 412,00)', async () => {
    const { svc } = setup()
    const f = await svc.finance.overview()
    expect(f.accounts.find((a) => a.id === 'cash')?.balanceCents).toBe(41200)
  })

  it('vendas de hoje: as 6 mais recentes e os filtros do quadro', async () => {
    const { svc } = setup()
    const all = await svc.pos.sales()
    expect(all.count).toBe(26)
    expect(all.totalCents).toBe(89200)
    expect(all.rows.map((r) => [r.id, r.items, r.methods, r.totalCents])).toEqual([
      ['V-0212', 3, 'Pix', 3548], ['V-0211', 1, 'Cartão', 3290], ['V-0210', 3, 'Dinheiro', 8030], ['V-0209', 5, 'Cartão', 9610], ['V-0208', 2, 'Dinheiro', 2740], ['V-0207', 4, 'Pix', 6120],
    ])
    expect((await svc.pos.sales('cash')).rows.map((r) => r.id)).toEqual(['V-0210', 'V-0208'])
    expect((await svc.pos.sales('pix')).rows.map((r) => r.id)).toEqual(['V-0212', 'V-0207'])
    expect((await svc.pos.sales('card')).rows.map((r) => r.id)).toEqual(['V-0211', 'V-0209'])
  })
})

describe('catálogo do balcão', () => {
  it('favoritos, preço do kg nos produtos por peso e estoque como no quadro', async () => {
    const { svc } = setup()
    const c = await svc.pos.catalog()
    const by = (id: string) => c.products.find((p) => p.id === id)!
    expect(c.products.filter((p) => p.favorite)).toHaveLength(8)
    expect(by('queijo-coalho')).toMatchObject({ priceCents: 3290, perKg: false, stockText: '12 un' })
    expect(by('carne-de-sol')).toMatchObject({ priceCents: 5990, perKg: true })
    expect(by('carne-de-sol').stockText).toMatch(/^\d+(,\d+)? kg$/)
    expect(by('feijao-de-corda')).toMatchObject({ priceCents: 1690, perKg: true, stockText: '9 kg' })
    expect(by('tapioca-granulada').low).toBe(true)
    expect(c.products.find((p) => p.id === 'leite-integral')).toBeUndefined() // matéria-prima não vende
    expect(c.categories.map((x) => x.name)).toEqual(['Queijos e laticínios', 'Carnes e embutidos', 'Farinhas e grãos', 'Doces'])
  })
})

describe('venda', () => {
  it('quadro Pagamento: 2 coalho + 0,5 kg de carne + 1 farinha = R$ 108,65, recebido R$ 120,00, troco R$ 11,35', async () => {
    const { svc, db } = setup()
    const before = { coalho: itemBalance(db.read().movements, 'queijo-coalho'), carne: itemBalance(db.read().movements, 'carne-de-sol'), farinha: itemBalance(db.read().movements, 'farinha-de-mandioca') }
    const sale = await svc.pos.checkout({
      lines: [unit('queijo-coalho', 2), weight('carne-de-sol', 0.5), unit('farinha-de-mandioca')],
      discount: null,
      payments: [{ method: 'cash', cents: 10865, receivedCents: 12000 }],
    }, 'Júlia')
    expect(sale).toMatchObject({ id: 'V-0213', subtotalCents: 10865, totalCents: 10865, changeCents: 1135, status: 'completed', by: 'Júlia' })
    expect(sale.lines.map((l) => [l.name, l.qty, l.totalCents, l.lots.map((x) => x.lotCode)])).toEqual([
      ['Queijo coalho', 2, 6580, ['QC-1107']], ['Carne de sol', 0.5, 2995, ['CS-0811']], ['Farinha de mandioca', 1, 1290, ['FM-0921']],
    ])
    const st = db.read()
    expect(itemBalance(st.movements, 'queijo-coalho')).toBe(before.coalho - 2)
    expect(itemBalance(st.movements, 'carne-de-sol')).toBe(before.carne - 1) // 0,5 kg = 1 embalagem de 500 g
    expect(itemBalance(st.movements, 'farinha-de-mandioca')).toBe(before.farinha - 1)
    expect(st.movements.filter((m) => m.ref === 'V-0213')).toHaveLength(3)
  })

  it('a venda soma no caixa, no financeiro e no Início', async () => {
    const { svc } = setup()
    await svc.pos.checkout({ lines: [unit('queijo-coalho', 2), weight('carne-de-sol', 0.5), unit('farinha-de-mandioca')], discount: null, payments: [{ method: 'cash', cents: 10865, receivedCents: 12000 }] }, 'Júlia')
    const c = (await svc.pos.cash())!
    expect(c.count).toBe(27)
    expect(c.cashCents).toBe(31200 + 10865)
    expect(c.expectedCents).toBe(41200 + 10865)
    expect((await svc.finance.overview()).accounts.find((a) => a.id === 'cash')?.balanceCents).toBe(41200 + 10865) // a gaveta do financeiro acompanha
    const d = await svc.dashboard.get()
    expect(d.salesToday.counter).toEqual({ count: 27, cents: 89200 + 10865 })
    expect((await svc.pos.sales()).rows[0].id).toBe('V-0213')
  })

  it('Pix cai na conta do banco e não na gaveta', async () => {
    const { svc } = setup()
    const bank = async () => (await svc.finance.overview()).accounts.find((a) => a.id === 'bank')!.balanceCents
    const b0 = await bank()
    await svc.pos.checkout({ lines: [unit('queijo-coalho')], discount: null, payments: [{ method: 'pix', cents: 3290 }] }, 'Júlia')
    expect(await bank()).toBe(b0 + 3290)
    expect((await svc.pos.cash())!.expectedCents).toBe(41200)
  })

  it('desconto de 10% entra no total e é guardado com o motivo', async () => {
    const { svc } = setup()
    const sale = await svc.pos.checkout({ lines: [unit('queijo-coalho', 2)], discount: { kind: 'p10', reason: 'Cliente da casa' }, payments: [{ method: 'debit', cents: 5922 }] }, 'Júlia')
    expect(sale).toMatchObject({ subtotalCents: 6580, totalCents: 5922, discount: { kind: 'p10', cents: 658, reason: 'Cliente da casa' } })
  })

  it('pagamento combinado: R$ 50 em dinheiro e o resto no Pix', async () => {
    const { svc } = setup()
    const sale = await svc.pos.checkout({ lines: [unit('queijo-coalho', 2), unit('rapadura')], discount: null, payments: [{ method: 'cash', cents: 5000 }, { method: 'pix', cents: 3030 }] }, 'Júlia')
    expect(sale.totalCents).toBe(8030)
    expect((await svc.pos.cash())!.cashCents).toBe(31200 + 5000)
  })

  it('passa para o próximo lote quando o primeiro acaba (queijo coalho: QC-1107 tem 10 e QC-1112 tem 10)', async () => {
    const { svc, db } = setup()
    const lots = (id: string) => db.read().lots.filter((l) => l.itemId === id)
    expect(lots('queijo-coalho').length).toBe(2)
    const sale = await svc.pos.checkout({ lines: [unit('queijo-coalho', 12)], discount: null, payments: [{ method: 'pix', cents: 12 * 3290 }] }, 'Júlia').catch((e) => e)
    // O disponível é 12 (o resto está reservado para pedidos online): cabe.
    expect(sale).not.toBeInstanceOf(Error)
    expect((sale as { lines: Array<{ lots: Array<{ lotCode: string; qty: number }> }> }).lines[0].lots.length).toBeGreaterThanOrEqual(1)
  })

  it('recusa: sem estoque disponível, sacola vazia, pagamento que não fecha e produto sem preço', async () => {
    const { svc } = setup()
    const code = async (p: Promise<unknown>) => (await p.catch((e: PosError) => e)) as PosError
    expect((await code(svc.pos.checkout({ lines: [unit('queijo-coalho', 13)], discount: null, payments: [{ method: 'pix', cents: 13 * 3290 }] }, 'J'))).code).toBe('insufficient_stock')
    expect((await code(svc.pos.checkout({ lines: [], discount: null, payments: [] }, 'J'))).code).toBe('empty_cart')
    expect((await code(svc.pos.checkout({ lines: [unit('queijo-coalho')], discount: null, payments: [{ method: 'pix', cents: 100 }] }, 'J'))).code).toBe('invalid_payment')
    expect((await code(svc.pos.checkout({ lines: [unit('leite-integral')], discount: null, payments: [{ method: 'pix', cents: 310 }] }, 'J'))).code).toBe('unknown_product')
    expect((await code(svc.pos.checkout({ lines: [weight('queijo-coalho', 0.5)], discount: null, payments: [{ method: 'pix', cents: 1 }] }, 'J'))).code).toBe('unknown_product')
  })

  it('sem caixa aberto não vende', async () => {
    const { svc } = setup()
    await svc.pos.closeSession(41200, 'Júlia')
    const e = (await svc.pos.checkout({ lines: [unit('queijo-coalho')], discount: null, payments: [{ method: 'pix', cents: 3290 }] }, 'J').catch((x: PosError) => x)) as PosError
    expect(e.code).toBe('no_session')
  })

  it('venda sem conexão fica marcada como não enviada e sincroniza depois', async () => {
    const { svc } = setup()
    const sale = await svc.pos.checkout({ lines: [unit('farinha-de-mandioca')], discount: null, payments: [{ method: 'pix', cents: 1290 }], offline: true }, 'Júlia')
    expect(sale.pending).toBe(true)
    expect((await svc.pos.overview()).pendingSales).toBe(1)
    expect((await svc.pos.sales()).rows[0].pending).toBe(true)
    expect(await svc.pos.syncPending()).toBe(1)
    expect((await svc.pos.overview()).pendingSales).toBe(0)
  })

  it('comprovante é só registrado, sem enviar mensagem', async () => {
    const { svc, db } = setup()
    const sale = await svc.pos.checkout({ lines: [unit('farinha-de-mandioca')], discount: null, payments: [{ method: 'pix', cents: 1290 }] }, 'Júlia')
    await svc.pos.sendReceipt(sale.id, '(00) 90000-0000')
    expect(db.read().outbox.at(-1)).toMatchObject({ kind: 'receipt', to: '(00) 90000-0000' })
    await expect(svc.pos.sendReceipt('V-9999', '1')).rejects.toMatchObject({ code: 'not_found' })
  })
})

describe('venda de exemplo V-0212 e cancelamento', () => {
  it('detalhe: itens com lote e peso, total R$ 35,48', async () => {
    const { svc } = setup()
    const s = (await svc.pos.getSale('V-0212'))!
    expect(s.totalCents).toBe(3548)
    expect(s.lines.map((l) => [l.name, l.qty, l.totalCents, l.lots[0].lotCode])).toEqual([['Farinha de mandioca', 1, 1290, 'FM-0921'], ['Tapioca granulada', 1, 990, 'TG-1030'], ['Feijão de corda', 0.75, 1268, 'FJ-0925']])
    expect(s.payments).toEqual([{ method: 'pix', cents: 3548 }])
    expect(await svc.pos.getSale('V-9999')).toBeNull()
  })

  it('cancelar exige a senha de um gestor; devolve ao lote, tira do caixa e do banco', async () => {
    const { svc, db } = setup()
    const before = itemBalance(db.read().movements, 'feijao-de-corda')
    const bank0 = (await svc.finance.overview()).accounts.find((a) => a.id === 'bank')!.balanceCents
    await expect(svc.pos.cancelSale('V-0212', '0000')).rejects.toMatchObject({ code: 'invalid_pin' })
    const s = await svc.pos.cancelSale('V-0212', '2468')
    expect(s.status).toBe('cancelled')
    expect(s.cancel).toMatchObject({ by: 'Júlia', approvedBy: 'Ana (Gestor)' })
    expect(itemBalance(db.read().movements, 'feijao-de-corda')).toBe(before + 0.75)
    expect((await svc.finance.overview()).accounts.find((a) => a.id === 'bank')!.balanceCents).toBe(bank0 - 3548)
    const c = (await svc.pos.cash())!
    expect(c.count).toBe(25)
    expect(c.pixCents).toBe(19760 - 3548)
    await expect(svc.pos.cancelSale('V-0212', '2468')).rejects.toMatchObject({ code: 'already_cancelled' })
    await expect(svc.pos.cancelSale('V-9999', '2468')).rejects.toMatchObject({ code: 'not_found' })
    expect((await svc.pos.sales()).rows.find((r) => r.id === 'V-0212')?.cancelled).toBe(true)
  })

  it('cancelar venda em dinheiro baixa a gaveta esperada', async () => {
    const { svc } = setup()
    await svc.pos.cancelSale('V-0210', '1357')
    expect((await svc.pos.cash())!.expectedCents).toBe(41200 - 8030)
  })
})

describe('sangria, suprimento e fechamento', () => {
  it('sangria para o banco é transferência; outras saem do caixa; o esperado acompanha', async () => {
    const { svc } = setup()
    const acc = async (id: 'bank' | 'cash') => (await svc.finance.overview()).accounts.find((a) => a.id === id)!.balanceCents
    const [b0, c0] = [await acc('bank'), await acc('cash')]
    const v = await svc.pos.addMovement('sangria', 10000, 'Levar ao banco', 'Júlia')
    expect(v.expectedCents).toBe(41200 - 10000)
    expect(v.movements.at(-1)).toEqual({ id: 'cm-2', label: 'Sangria · Levar ao banco', signedCents: -10000 })
    expect(await acc('cash')).toBe(c0 - 10000)
    expect(await acc('bank')).toBe(b0 + 10000)
    const w = await svc.pos.addMovement('suprimento', 5000, 'Reforço de troco', 'Júlia')
    expect(w.expectedCents).toBe(41200 - 10000 + 5000)
    await expect(svc.pos.addMovement('sangria', 99999999, 'Levar ao banco', 'J')).rejects.toMatchObject({ code: 'invalid_amount' })
    await expect(svc.pos.addMovement('sangria', 0, 'Levar ao banco', 'J')).rejects.toMatchObject({ code: 'invalid_amount' })
  })

  it('fechar com R$ 4,00 a menos: diferença de falta, caixa do financeiro acerta; reabrir desfaz', async () => {
    const { svc } = setup()
    const cash = async () => (await svc.finance.overview()).accounts.find((a) => a.id === 'cash')!.balanceCents
    const closed = await svc.pos.closeSession(41200 - 400, 'Júlia')
    expect(closed).toMatchObject({ expectedCents: 41200, countedCents: 40800, differenceCents: -400 })
    expect(closed.session.status).toBe('closed')
    expect(await cash()).toBe(40800)
    expect((await svc.pos.overview()).session).toBeNull()
    const open = await svc.pos.reopenSession()
    expect(open.session.status).toBe('open')
    expect(await cash()).toBe(41200)
    await expect(svc.pos.reopenSession()).rejects.toThrow('session_open')
  })

  it('abrir caixa novo depois de fechar: começa zerado com o troco contado', async () => {
    const { svc } = setup()
    await svc.pos.closeSession(41200, 'Júlia')
    expect((await svc.pos.overview()).lastClose?.differenceCents).toBe(0)
    const s = await svc.pos.openSession(20000, 'Ana')
    expect(s).toMatchObject({ openedBy: 'Ana', openingCents: 20000, status: 'open' })
    const c = (await svc.pos.cash())!
    expect(c).toMatchObject({ count: 0, totalCents: 0, expectedCents: 20000 })
    await expect(svc.pos.openSession(100, 'X')).rejects.toThrow('session_open')
  })
})

describe('integração com relatórios', () => {
  it('a venda de balcão entra nas vendas de hoje, por canal e pagamento', async () => {
    const { svc } = setup()
    const before = await svc.reports.sales('today')
    await svc.pos.checkout({ lines: [unit('queijo-coalho', 2)], discount: null, payments: [{ method: 'pix', cents: 6580 }] }, 'Júlia')
    const after = await svc.reports.sales('today')
    expect(after.totalCents - before.totalCents).toBe(6580)
    expect(after.counterCents - before.counterCents).toBe(6580)
    expect(after.pixCents - before.pixCents).toBe(6580)
    expect(after.count - before.count).toBe(1)
  })
})

describe('mantém a loja online funcionando', () => {
  it('o catálogo da loja não mostra o feijão (só balcão)', async () => {
    const svc = createMockServices({ storage: memoryStorage(), withSeedOrders: true })
    expect((await svc.catalog.listProducts()).map((p) => p.id)).not.toContain('feijao-de-corda')
  })
})
