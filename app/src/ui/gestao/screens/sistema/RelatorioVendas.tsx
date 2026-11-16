import { useState } from 'react'
import { FilterChips } from '@/components/Field'
import { shortDate, daysFromToday } from '@/domain/dates'
import { formatCents } from '@/domain/money'
import { salesReport } from '@/mocks/gestao/people'
import o from '@/styles/ops.module.css'
import { Bar, SumRow } from '../../../shared/OpsBits'
import s from './Sistema.module.css'

const money = (v: number) => formatCents(Math.round(v * 100))
type Period = 'today' | 'week' | 'month'

// H-G28 — vendas por período, canal, pagamento e mais vendidos; um único gráfico de barras por dia
export function RelatorioVendas() {
  const [period, setPeriod] = useState<Period>('week')
  const [sel, setSel] = useState(6)
  const p = salesReport.periods.find((x) => x.key === period)!
  const days = salesReport.days
  const max = Math.max(...days)
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
          options={salesReport.periods.map((x) => ({ value: x.key as Period, label: x.label }))}
        />
        <div>
          <div className={o.muted}>{periodLabel}</div>
          <div style={{ font: '700 34px/40px var(--fonte-titulo)', fontVariantNumeric: 'tabular-nums' }}>{money(p.total)}</div>
          <div className={`${o.muted} ${o.num}`}>{p.sub}</div>
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
                  <span className={s.bar} style={{ height: `${Math.round((v / max) * 140)}px`, background: i === sel ? 'var(--cor-terracota)' : 'var(--texto-secundario)' }} />
                  <span className={s.barLabel}>{day(i).slice(0, 2)}</span>
                </button>
              ))}
            </div>
            <div className={o.small}>Toque numa barra para ver o valor do dia. Sexta e sábado vendem mais.</div>
          </section>
        )}
        <section className={o.card}>
          <b>Por canal</b>
          <SumRow label="Balcão" value={money(p.counter)} />
          <SumRow label="Loja online" value={money(p.online)} />
        </section>
        <section className={o.card}>
          <b>Por forma de pagamento</b>
          <SumRow label="Pix" value={money(p.pix)} />
          <SumRow label="Cartão" value={money(p.card)} />
          <SumRow label="Dinheiro" value={money(p.cash)} />
        </section>
        <section className={o.card}>
          <b>Mais vendidos</b>
          <SumRow label="Queijo coalho 500 g" value={p.top[0]} />
          <SumRow label="Farinha de mandioca 1 kg" value={p.top[1]} />
          <SumRow label="Carne de sol" value={p.top[2]} />
        </section>
        <p className={o.muted}>Exportar em planilha ou PDF fica no menu de compartilhar do aparelho. Números de exemplo até o PDV e a loja gravarem no banco.</p>
      </main>
    </div>
  )
}
