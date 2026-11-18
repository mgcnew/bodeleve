import { useMemo } from 'react'
import { buildSalesReport, type SalesPeriod, type SalesReport } from '@/domain/reports'
import { supabase } from '@/lib/supabase'
import { salesReport as sample } from '@/mocks/gestao/people'
import { salesToday as sampleToday } from '@/mocks/gestao/dashboard'
import { salesRowsStore } from './reportsRemote'

const cents = (v: number) => Math.round(v * 100)

/** Sem o Supabase: números de exemplo no mesmo formato do relatório real */
function sampleReport(): SalesReport {
  const toPeriod = (p: (typeof sample.periods)[number]): SalesPeriod => ({
    total: cents(p.total),
    count: Number(/^(\d+)/.exec(p.sub)?.[1] ?? 0),
    counter: { count: 0, total: cents(p.counter) },
    online: { count: 0, total: cents(p.online) },
    pix: cents(p.pix),
    card: cents(p.card),
    cash: cents(p.cash),
    pending: 0,
    top: [
      { name: 'Queijo coalho 500 g', qty: p.top[0] },
      { name: 'Farinha de mandioca 1 kg', qty: p.top[1] },
      { name: 'Carne de sol', qty: p.top[2] },
    ],
  })
  const [today, week, month] = sample.periods.map(toPeriod)
  return {
    days: sample.days.map(cents),
    today: { ...today, count: sampleToday.count, total: sampleToday.totalCents, counter: { count: sampleToday.counter.count, total: sampleToday.counter.totalCents }, online: { count: sampleToday.online.count, total: sampleToday.online.totalCents } },
    week,
    month,
    yesterdaySameTime: sampleToday.yesterdaySameTimeCents,
  }
}

/** Relatório de vendas: dos pedidos gravados com o Supabase ligado; senão, de exemplo */
export function useSalesReport(): SalesReport {
  const rows = salesRowsStore.useStore()
  return useMemo(() => (supabase ? buildSalesReport(rows) : sampleReport()), [rows])
}
