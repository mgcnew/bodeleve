import { cx } from '@/lib/cx'
import s from './Indicator.module.css'

type IndicatorProps = {
  label: string
  value: string
  caption?: string
  /** `warning` = pede atenção (estoque baixo); `error` = urgente (a pagar hoje). O rótulo e a legenda dizem o porquê, não só a cor. */
  tone?: 'default' | 'warning' | 'error'
}

/** Indicador do início da gestão. */
export function Indicator({ label, value, caption, tone = 'default' }: IndicatorProps) {
  return (
    <div className={cx(s.box, tone !== 'default' && s[tone])}>
      <div className={s.label}>{label}</div>
      <div className={s.value}>{value}</div>
      {caption && <div className={s.caption}>{caption}</div>}
    </div>
  )
}
