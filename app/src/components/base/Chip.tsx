import type { ButtonHTMLAttributes } from 'react'
import { cx } from '@/lib/cx'
import s from './Chip.module.css'

export type ChipProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'aria-pressed'> & {
  selected?: boolean
}

/** Atalho ou filtro de 44 px. Selecionado = preenchido em grafite (cor + peso de preenchimento, e `aria-pressed`). */
export function Chip({ selected = false, className, type = 'button', ...rest }: ChipProps) {
  return <button type={type} aria-pressed={selected} className={cx(s.chip, selected && s.on, className)} {...rest} />
}
