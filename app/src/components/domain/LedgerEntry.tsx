import type { ReactNode } from 'react'
import { cx } from '@/lib/cx'
import { formatSignedBRL } from '@/lib/format'
import { StatusTag, type Tone } from '../base/StatusTag'
import s from './LedgerEntry.module.css'

/** Lista de lançamentos: use <LedgerEntry /> dentro. */
export function LedgerList({ children, label }: { children: ReactNode; label?: string }) {
  return <ul className={s.list} aria-label={label}>{children}</ul>
}

type LedgerEntryProps = {
  title: string
  /** "A pagar · vence hoje" */
  detail: string
  /** Positivo = entrada, negativo = saída. Em centavos. */
  amountCents: number
  status: { label: string; tone: Tone }
}

/** Lançamento financeiro. O sinal (+/−) e a etiqueta de status dizem entrada/saída e situação, além da cor. */
export function LedgerEntry({ title, detail, amountCents, status }: LedgerEntryProps) {
  return (
    <li className={s.entry}>
      <div className={s.body}>
        <div className={s.title}>{title}</div>
        <div className={s.detail}>{detail}</div>
      </div>
      <div className={s.side}>
        <div className={cx(s.amount, amountCents > 0 && s.in)}>{formatSignedBRL(amountCents)}</div>
        <StatusTag tone={status.tone}>{status.label}</StatusTag>
      </div>
    </li>
  )
}
