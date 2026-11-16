import type { CashSession, PosSale, SaleLine } from '@/domain/pos'

/**
 * Balcão de EXEMPLO (quadros do PDV): caixa aberto por Júlia desde 08h02, com a base de vendas do dia (26 vendas, R$ 892,00)
 * e as seis mais recentes registradas uma a uma. Os totais fecham com o quadro Caixa: dinheiro R$ 312,00, Pix R$ 197,60, cartão R$ 382,40;
 * gaveta esperada R$ 412,00 (R$ 150,00 de troco + R$ 312,00 em dinheiro − R$ 50,00 de sangria).
 */

export function buildPosSeed(now: Date): { sessions: CashSession[]; sales: PosSale[] } {
  const min = (m: number) => new Date(now.getTime() + m * 60_000).toISOString()
  const todayAt = (h: number, m: number, fallbackMinutes: number) => {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m)
    return d <= now ? d.toISOString() : min(fallbackMinutes)
  }
  const yesterday = (h: number, m: number) => new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, h, m).toISOString()

  const sessions: CashSession[] = [
    {
      id: 'cx-1', openedAt: yesterday(8, 0), openedBy: 'Júlia', openingCents: 15000, baseline: { count: 31, cashCents: 28100, pixCents: 21900, cardCents: 40200 }, movements: [],
      status: 'closed', closedAt: yesterday(18, 30), closedBy: 'Júlia', countedCents: 43100, expectedCents: 43100,
    },
    {
      id: 'cx-2', openedAt: todayAt(8, 2, -420), openedBy: 'Júlia', openingCents: 15000, baseline: { count: 20, cashCents: 20430, pixCents: 10092, cardCents: 25340 },
      movements: [{ id: 'cm-1', at: todayAt(11, 20, -240), kind: 'sangria', cents: 5000, reason: 'Troco para entregador', by: 'Júlia' }],
      status: 'open', closedAt: null, closedBy: null, countedCents: null, expectedCents: null,
    },
  ]

  const line = (itemId: string, name: string, kind: 'unit' | 'weight', qty: number, unitPriceCents: number, totalCents: number, lotCode: string, stockUnits = qty): SaleLine => ({
    itemId, name, kind, qty, unitPriceCents, totalCents, stockUnits, lots: [{ lotCode, qty: stockUnits }],
  })
  const sale = (id: string, minutesAgo: number, lines: SaleLine[], method: 'cash' | 'pix' | 'debit' | 'credit', received?: number): PosSale => {
    const total = lines.reduce((a, l) => a + l.totalCents, 0)
    return {
      id, sessionId: 'cx-2', at: min(-minutesAgo), by: 'Júlia', lines, subtotalCents: total, discount: null, totalCents: total,
      payments: [{ method, cents: total, ...(received ? { receivedCents: received } : {}) }], changeCents: received ? received - total : 0,
      status: 'completed', cancel: null, movementIds: [], seed: true,
    }
  }
  const coalho = (q: number) => line('queijo-coalho', 'Queijo coalho', 'unit', q, 3290, 3290 * q, 'QC-1107')
  const rapadura = line('rapadura', 'Rapadura', 'unit', 1, 1450, 1450, 'RP-1002')
  const farinha = line('farinha-de-mandioca', 'Farinha de mandioca', 'unit', 1, 1290, 1290, 'FM-0921')
  const tapioca = line('tapioca-granulada', 'Tapioca granulada', 'unit', 1, 990, 990, 'TG-1030')
  const flocao = line('flocao-de-milho', 'Flocão de milho', 'unit', 1, 590, 590, 'FL-0915')
  const nata = line('nata', 'Nata', 'unit', 1, 950, 950, 'NT-1110')

  const sales: PosSale[] = [
    sale('V-0207', 96, [coalho(1), farinha, nata, flocao], 'pix'),
    sale('V-0208', 71, [farinha, rapadura], 'cash', 3000),
    sale('V-0209', 50, [coalho(2), tapioca, rapadura, flocao], 'credit'),
    sale('V-0210', 33, [coalho(2), rapadura], 'cash', 10000),
    sale('V-0211', 21, [coalho(1)], 'debit'),
    // Feijão de corda por peso: 0,750 kg × R$ 16,90 = R$ 12,68 (arredondado ao centavo).
    sale('V-0212', 7, [farinha, tapioca, line('feijao-de-corda', 'Feijão de corda', 'weight', 0.75, 1690, 1268, 'FJ-0925', 0.75)], 'pix'),
  ]
  return { sessions, sales }
}
