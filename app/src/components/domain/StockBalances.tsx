import type { ReactNode } from 'react'
import { Icon } from '../Icon'
import { StatusTag, type Tone } from '../base/StatusTag'
import s from './StockBalances.module.css'

type StockBalancesProps = {
  name: string
  status?: { label: string; tone: Tone }
  /** Valores já formatados com unidade quando preciso. Disponível = físico − reservado (H1). */
  physical: string
  reserved: string
  available: string
  projected: string
  /** <LotRow />s */
  children?: ReactNode
}

/** Os quatro saldos de estoque: físico, reservado, disponível (em destaque) e projetado. */
export function StockBalances({ name, status, physical, reserved, available, projected, children }: StockBalancesProps) {
  const cells: Array<[string, string, boolean]> = [
    ['Físico', physical, false],
    ['Reservado', reserved, false],
    ['Disponível', available, true],
    ['Projetado', projected, false],
  ]
  return (
    <div className={s.card}>
      <div className={s.head}>
        <div className={s.name}>{name}</div>
        {status && <StatusTag tone={status.tone}>{status.label}</StatusTag>}
      </div>
      <dl className={s.grid} style={{ margin: 0 }}>
        {cells.map(([label, value, strong]) => (
          <div key={label} className={`${s.cell} ${strong ? s.strong : ''}`}>
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
      {children}
    </div>
  )
}

type LotRowProps = {
  code: string
  /** "Validade 19/11/2026 · 8 un" */
  info: string
  status: { label: string; tone: Tone }
}

/** Lote e validade. Ordem de saída segue o que vence primeiro (H-G11). */
export function LotRow({ code, info, status }: LotRowProps) {
  return (
    <div className={s.lot}>
      <Icon name="validade" size={20} />
      <div className={s.lotBody}>
        <div className={s.lotCode}>{code}</div>
        <div className={s.lotInfo}>{info}</div>
      </div>
      <StatusTag tone={status.tone}>{status.label}</StatusTag>
    </div>
  )
}
