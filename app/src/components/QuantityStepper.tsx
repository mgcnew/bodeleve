import { IconButton } from './Button'
import styles from './QuantityStepper.module.css'

type Props = {
  value: number
  onChange: (value: number) => void
  min?: number
  /** nome do grupo, ex.: "Quantidade de Queijo coalho" */
  label?: string
  labelledBy?: string
  large?: boolean
}

export function QuantityStepper({ value, onChange, min = 0, label, labelledBy, large }: Props) {
  return (
    <div role="group" aria-label={label} aria-labelledby={labelledBy} className={styles.group}>
      <IconButton
        icon="remover"
        label="Diminuir"
        tone="muted"
        disabled={value <= min}
        onClick={() => onChange(Math.max(min, value - 1))}
      />
      <div aria-live="polite" className={`${styles.value} ${large ? styles.large : ''}`}>
        {value}
      </div>
      <IconButton icon="adicionar" label="Aumentar" tone="primary" onClick={() => onChange(value + 1)} />
    </div>
  )
}
