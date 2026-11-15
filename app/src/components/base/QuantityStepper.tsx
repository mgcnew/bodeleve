import { cx } from '@/lib/cx'
import { Icon } from '../Icon'
import s from './QuantityStepper.module.css'

type QuantityStepperProps = {
  value: number
  onChange: (next: number) => void
  min?: number
  max?: number
  /** Nome do grupo, p. ex. "Quantidade de Queijo coalho". */
  label: string
  variant?: 'joined' | 'compact'
}

export function QuantityStepper({ value, onChange, min = 0, max, label, variant = 'joined' }: QuantityStepperProps) {
  const dec = () => onChange(Math.max(min, value - 1))
  const inc = () => onChange(max == null ? value + 1 : Math.min(max, value + 1))
  return (
    <div role="group" aria-label={label} className={cx(s.group, s[variant])}>
      <button type="button" className={cx(s.btn, s.minus)} aria-label="Diminuir" onClick={dec} disabled={value <= min}>
        <Icon name="remover" size={20} />
      </button>
      <div className={s.value} aria-live="polite">{value}</div>
      <button type="button" className={cx(s.btn, s.plus)} aria-label="Aumentar" onClick={inc} disabled={max != null && value >= max}>
        <Icon name="adicionar" size={20} />
      </button>
    </div>
  )
}
