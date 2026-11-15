import { formatBRL } from '@/lib/format'
import s from './SaleLine.module.css'

type SaleLineProps = { name: string; detail: string; totalCents: number }

/** Linha da venda no PDV: "0,500 kg × R$ 59,90" e o total da linha. */
export function SaleLine({ name, detail, totalCents }: SaleLineProps) {
  return (
    <div className={s.line}>
      <div className={s.body}>
        <div className={s.name}>{name}</div>
        <div className={s.detail}>{detail}</div>
      </div>
      <div className={s.total}>{formatBRL(totalCents)}</div>
    </div>
  )
}
