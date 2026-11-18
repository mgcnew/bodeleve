import { useEffect, useState } from 'react'
import { FilterChips } from '@/components/Field'
import { shortDate, daysFromToday } from '@/domain/dates'
import { formatCents } from '@/domain/money'
import { ticket } from '@/domain/reports'
import { useSalesReport } from '@/services/gestao/reports'
import { refreshSales } from '@/services/gestao/reportsRemote'
import o from '@/styles/ops.module.css'
import { Bar, SumRow } from '../../../shared/OpsBits'
import s from './Sistema.module.css'

const money = formatCents
type Period = 'today' | 'week' | 'month'

// H-G28 — vendas por período, canal, pagamento e mais vendidos; um único gráfico de barras por dia
export function RelatorioVendas() {
  const [period, setPeriod] = useState<Period>('week')
  const [sel, setSel] = useState(6)
  const report = useSalesReport()
  useEffect(() => {
    void refreshSales()
  }, [])
  const p = period === 'today' ? report.today : period === 'week' ? report.week : report.month
  const days = report.days
  const max = Math.max(1, ...days)
  const day = (i: number) => shortDate(daysFromToday(i - 6))
  const periodLabel = period === 'today' ? `Hoje, ${day(6)}` : period === 'week' ? `${day(0)} a ${day(6)}` : `01/${day(6).slice(3)} a ${day(6)}`

  return (
    <div className={o.screen}>
      <Bar title="Vendas" back="/gestao/relatorios" />
      <main className={`${o.main} ${o.mainTop} ${o.narrow}`}>
        <FilterChips
          label="Período"
          value={period}
          onChange={setPeriod}
          options={[
            { value: 'today', label: 'Hoje' },
            { value: 'week', label: '7 dias' },
            { value: 'month', label: 'Mês' },
          ]}
        />
        <div>
          <div className={o.muted}>{periodLabel}</div>
          <div style={{ font: '700 34px/40px var(--fonte-titulo)', fontVariantNumeric: 'tabular-nums' }}>{money(p.total)}</div>
          <div className={`${o.muted} ${o.num}`}>
            {p.count} {p.count === 1 ? 'venda' : 'vendas'} · ticket médio {money(ticket(p))}
          </div>
        </div>
        {period === 'week' && (
          <section className={o.card} style={{ padding: 16 }}>
            <div className={o.cardHead}>
              <b>Vendas por dia</b>
              <span className={`${o.muted} ${o.num}`}>
                {day(sel)} · {money(days[sel])}
              </span>
            </div>
            <div className={s.chart}>
              {days.map((v, i) => (
                <button key={i} type="button" className={s.barBtn} aria-label={`${day(i)}: ${money(v)}`} aria-pressed={i === sel} onClick={() => setSel(i)}>
                  <span className={s.bar} style={{ height: `${Math.round((v / max) * 140)}px`, background: i === sel ? 'var(--cor-primaria)' : 'var(--texto-secundario)' }} />
                  <span className={s.barLabel}>{day(i).slice(0, 2)}</span>
                </button>
              ))}
            </div>
            <div className={o.small}>Toque numa barra para ver o valor do dia.</div>
          </section>
        )}
        <section className={o.card}>
          <b>Por canal</b>
          <SumRow label={`Balcão · ${p.counter.count}`} value={money(p.counter.total)} />
          <SumRow label={`Loja online · ${p.online.count}`} value={money(p.online.total)} />
        </section>
        <section className={o.card}>
          <b>Por forma de pagamento</b>
          <SumRow label="Pix" value={money(p.pix)} />
          <SumRow label="Cartão" value={money(p.card)} />
          <SumRow label="Dinheiro" value={money(p.cash)} />
          {p.pending > 0 && <SumRow label="A receber na retirada" value={money(p.pending)} />}
        </section>
        <section className={o.card}>
          <b>Mais vendidos</b>
          {p.top.length === 0 ? <span className={o.muted}>Ainda não há vendas neste período.</span> : p.top.map((t) => <SumRow key={t.name} label={t.name} value={t.qty} />)}
        </section>
        <p className={o.muted}>Exportar em planilha ou PDF fica no menu de compartilhar do aparelho. Vale como venda todo pedido não cancelado, do balcão e da loja.</p>
      </main>
    </div>
  )
}
