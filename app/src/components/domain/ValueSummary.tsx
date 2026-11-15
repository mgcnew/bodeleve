import { cx } from '@/lib/cx'
import s from './ValueSummary.module.css'

type Line = { label: string; value: string }

type ValueSummaryProps = {
  lines: Line[]
  total: Line
  /** Pinta o total de erro (ex.: diferença de caixa negativa). O sinal "−" no texto continua sendo o sinal principal. */
  totalTone?: 'default' | 'negative'
}

/** Resumo de valores: linhas em cinza e total em destaque. Os textos já chegam formatados ("R$ 8,00", "Grátis"). */
export function ValueSummary({ lines, total, totalTone = 'default' }: ValueSummaryProps) {
  return (
    <div className={s.box}>
      {lines.map((l) => (
        <div key={l.label} className={s.row}><span>{l.label}</span><span>{l.value}</span></div>
      ))}
      <div className={cx(s.row, s.total, totalTone === 'negative' && s.negative)}><span>{total.label}</span><span>{total.value}</span></div>
    </div>
  )
}
