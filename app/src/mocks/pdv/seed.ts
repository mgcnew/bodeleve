// Vendas e caixa de exemplo (design/PDV-*.dc.html). Horários relativos a agora.
import type { CashSession, Sale, SaleLine } from '@/domain/pdv'
import { minutesBefore } from '@/domain/dates'

const line = (itemId: string, name: string, quantity: number, unitPriceCents: number, lotCode: string | null, grams: number | null = null): SaleLine => ({
  itemId,
  name,
  grams,
  quantity,
  unitPriceCents,
  totalCents: Math.round(grams !== null ? (unitPriceCents * grams) / 1000 : unitPriceCents * quantity),
  lotCode,
})

const sale = (number: string, minutes: number, lines: SaleLine[], method: Sale['payments'][number]['method']): Sale => {
  const total = lines.reduce((n, l) => n + l.totalCents, 0)
  return {
    id: `v-${number}`,
    number: `V-${number}`,
    at: minutesBefore(minutes),
    by: 'Júlia',
    lines,
    subtotalCents: total,
    discountCents: 0,
    discountLabel: null,
    discountReason: null,
    totalCents: total,
    payments: [{ method, cents: total, receivedCents: method === 'cash' ? Math.ceil(total / 1000) * 1000 : undefined }],
    changeCents: method === 'cash' ? Math.ceil(total / 1000) * 1000 - total : 0,
    status: 'done',
    cancelledAt: null,
    cancelledBy: null,
    effects: { movementIds: [], ledgerIds: [], entryIds: [] },
  }
}

export const seedSales = (): Sale[] => [
  sale('0212', 7, [line('farinha-de-mandioca', 'Farinha de mandioca', 1, 1290, 'FM-0921'), line('tapioca-granulada', 'Tapioca granulada', 1, 990, 'TG-1030'), line('feijao-de-corda', 'Feijão de corda', 1, 1690, null, 750)], 'pix'),
  sale('0211', 21, [line('queijo-coalho', 'Queijo coalho', 1, 3290, 'QC-1107')], 'debit'),
  sale('0210', 33, [line('queijo-coalho', 'Queijo coalho', 2, 3290, 'QC-1107'), line('rapadura', 'Rapadura', 1, 1450, 'RB-0412'), line('nata', 'Nata', 1, 950, 'NT-1101')], 'cash'),
  sale('0209', 50, [line('carne-de-sol', 'Carne de sol', 1, 5990, 'CS-1110', 1000), line('doce-de-leite', 'Doce de leite', 1, 1890, 'DL-1102'), line('manteiga-de-garrafa', 'Manteiga de garrafa', 1, 2800, null)], 'credit'),
  sale('0208', 75, [line('queijo-manteiga', 'Queijo manteiga', 1, 3690, 'QM-1109')], 'cash'),
  sale('0207', 100, [line('requeijao', 'Requeijão', 2, 1190, 'RQ-1104'), line('queijo-coalho', 'Queijo coalho', 1, 3290, 'QC-1107')], 'pix'),
]

export const seedCash = (): { session: CashSession | null; lastClose: { at: string; diffCents: number } } => ({
  session: {
    id: 'cx-1',
    openedAt: minutesBefore(420),
    openedBy: 'Júlia',
    floatCents: 15000,
    movements: [{ id: 'cm-1', kind: 'withdrawal', cents: 5000, reason: 'Troco para entregador', at: minutesBefore(90) }],
    closedAt: null,
    countedCents: null,
    expectedCents: null,
  },
  lastClose: { at: minutesBefore(60 * 24), diffCents: 0 },
})
