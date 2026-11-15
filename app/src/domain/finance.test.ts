import { describe, expect, it } from 'vitest'
import { addMonth, balanceOf, FinanceError, forecast, isOpen, ledger, ledgerTotals, payEntry, remaining, standingOf, totals, undoPayment, type FinanceState } from './finance'
import { buildFinanceSeed } from '@/mocks/stockSeed'

const now = new Date('2026-11-14T15:30:00')
const fresh = (): FinanceState => structuredClone(buildFinanceSeed(now))
const day = (plus: number) => new Date(2026, 10, 14 + plus, 12).toISOString()

describe('saldos dos quadros', () => {
  const st = fresh()
  it('banco R$ 6.380,40 + caixa R$ 412,00 = R$ 6.792,40', () => {
    expect(balanceOf(st.transactions, 'bank')).toBe(638040)
    expect(balanceOf(st.transactions, 'cash')).toBe(41200)
    expect(balanceOf(st.transactions, 'bank') + balanceOf(st.transactions, 'cash')).toBe(679240)
  })
  it('a pagar R$ 3.097,00 e a receber R$ 1.150,00 (os R$ 622,00 do PC-0057 ainda nascem no recebimento)', () => {
    expect(totals(st.entries)).toEqual({ payableCents: 309700, receivableCents: 115000 })
  })
  it('aluguel está atrasado há 4 dias; laticínios e energia vencem hoje', () => {
    const by = (id: string) => standingOf(st.entries.find((e) => e.id === id)!, now)
    expect(by('fe-1')).toEqual({ standing: 'overdue', daysLate: 4 })
    expect(by('fe-2').standing).toBe('today')
    expect(by('fe-3').standing).toBe('today')
    expect(by('fe-4').standing).toBe('upcoming')
  })
})

describe('previsão de 7 dias (H-G21)', () => {
  const st = fresh()
  const f = forecast(st.entries, 679240, now)
  it('reproduz as linhas e os saldos do quadro', () => {
    expect(f.rows.map((r) => [r.label, r.deltaCents, r.balanceAfter])).toEqual([
      ['Hoje', -244000, 435240],
      ['15/11', 21000, 456240],
      ['17/11', 78000, 534240],
      ['20/11', 16000, 550240],
      ['21/11', -51200, 499040],
    ])
    expect(f.finalBalance).toBe(499040)
    expect(f.finalLabel).toBe('21/11')
  })
  it('o atrasado conta em "Hoje" e é marcado', () => {
    expect(f.rows[0].description).toBe('Aluguel (atrasado), Laticínios e energia')
  })
  it('o gás (25/11) fica fora dos 7 dias', () => {
    expect(f.rows.some((r) => r.description.includes('Gás'))).toBe(false)
  })
})

describe('pagar conta (H-G23)', () => {
  const rentPay = (over: Partial<Parameters<typeof payEntry>[2]> = {}) => ({ amountCents: 180000, fineCents: 0, accountId: 'bank' as const, method: 'Pix', paidAt: now.toISOString(), ...over })
  it('aluguel pelo banco: saldo vai a R$ 4.580,40 e o próximo aluguel já fica lançado para 10/12', () => {
    const st = fresh()
    const r = payEntry(st, 'fe-1', rentPay(), now)
    expect(r.balanceAfter).toBe(458040)
    expect(isOpen(r.entry)).toBe(false)
    expect(r.next).not.toBeNull()
    expect(new Date(r.next!.dueAt).getDate()).toBe(10)
    expect(new Date(r.next!.dueAt).getMonth()).toBe(11) // dezembro
    expect(r.next!.amountCents).toBe(180000)
    expect(totals(st.entries).payableCents).toBe(309700 - 180000 + 180000)
  })
  it('caixa não cobre R$ 1.800: avisa com o saldo do caixa e não lança nada', () => {
    const st = fresh()
    const before = st.transactions.length
    try {
      payEntry(st, 'fe-1', rentPay({ accountId: 'cash' }), now)
      expect.unreachable()
    } catch (e) {
      expect(e).toBeInstanceOf(FinanceError)
      expect((e as FinanceError).code).toBe('insufficient_balance')
      expect((e as FinanceError).detail).toBe('41200')
    }
    expect(st.transactions).toHaveLength(before)
    expect(isOpen(st.entries.find((x) => x.id === 'fe-1')!)).toBe(true)
  })
  it('paga só uma parte: o restante continua em aberto e não lança a próxima despesa', () => {
    const st = fresh()
    const r = payEntry(st, 'fe-1', rentPay({ amountCents: 40000, accountId: 'cash', method: 'Dinheiro' }), now)
    expect(remaining(r.entry)).toBe(140000)
    expect(r.next).toBeNull()
    expect(balanceOf(st.transactions, 'cash')).toBe(1200)
  })
  it('multa e juros saem do saldo, mas não quitam além da conta', () => {
    const st = fresh()
    const r = payEntry(st, 'fe-1', rentPay({ fineCents: 5000 }), now)
    expect(r.balanceAfter).toBe(638040 - 185000)
    expect(isOpen(r.entry)).toBe(false)
  })
  it('recusa valor maior que o restante, zero e conta já paga', () => {
    const st = fresh()
    expect(() => payEntry(st, 'fe-1', rentPay({ amountCents: 190000 }), now)).toThrowError('invalid_amount')
    expect(() => payEntry(st, 'fe-1', rentPay({ amountCents: 0 }), now)).toThrowError('invalid_amount')
    payEntry(st, 'fe-1', rentPay(), now)
    expect(() => payEntry(st, 'fe-1', rentPay(), now)).toThrowError('already_paid')
    expect(() => payEntry(st, 'fe-9', rentPay({ amountCents: 100 }), now)).toThrowError('not_found') // a receber não é paga aqui
  })
  it('desfazer lança o contrário, reabre a conta e tira a próxima despesa', () => {
    const st = fresh()
    const r = payEntry(st, 'fe-1', rentPay(), now)
    const n = st.entries.length
    const e = undoPayment(st, r.transactionId, now)
    expect(isOpen(e)).toBe(true)
    expect(balanceOf(st.transactions, 'bank')).toBe(638040)
    expect(st.entries.length).toBe(n - 1)
    expect(() => undoPayment(st, r.transactionId, now)).toThrowError('cannot_reverse')
  })
  it('não desfaz se a próxima despesa já foi paga', () => {
    const st = fresh()
    const r = payEntry(st, 'fe-1', rentPay(), now)
    payEntry(st, r.next!.id, rentPay({ amountCents: 1000 }), now)
    expect(() => undoPayment(st, r.transactionId, now)).toThrowError('cannot_reverse')
  })
  it('mês seguinte respeita o último dia do mês', () => {
    expect(new Date(addMonth(new Date(2026, 0, 31, 12).toISOString())).getDate()).toBe(28) // 31/01 → 28/02
  })
})

describe('lançamentos (quadro Lançamentos)', () => {
  const rows = ledger(fresh().transactions)
  const t = ledgerTotals(rows)
  it('entradas R$ 1.244,50 e saídas R$ 780,00; transferência não conta', () => {
    expect(t).toEqual({ inCents: 124450, outCents: 78000 })
  })
  it('a sangria aparece uma vez, como transferência entre contas', () => {
    const tr = rows.filter((r) => r.kind === 'transfer')
    expect(tr).toHaveLength(1)
    expect(tr[0]).toMatchObject({ title: 'Sangria do caixa', amountCents: 60000, detail: 'Caixa → banco · transferência entre contas' })
  })
  it('mais recentes primeiro', () => {
    expect(rows.map((r) => r.title)).toEqual([
      'Vendas no balcão · dinheiro', 'Vendas no Pix', 'Embalagens a vácuo', 'Sangria do caixa', 'Cartão de débito · liquidação', 'Charqueada Norte · PC-0050',
    ])
  })
  it('um pagamento novo entra sozinho nos lançamentos, como saída', () => {
    const st = fresh()
    payEntry(st, 'fe-2', { amountCents: 42000, fineCents: 0, accountId: 'bank', method: 'Boleto', paidAt: now.toISOString() }, now)
    const r = ledger(st.transactions)
    expect(r[0]).toMatchObject({ kind: 'out', title: 'Laticínios Serra Verde', amountCents: -42000 })
    expect(day(0)).toBeTruthy()
  })
})
