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
  /** passo do botão; decimais para itens vendidos por peso */
  step?: number
}

export function QuantityStepper({ value, onChange, min = 0, label, labelledBy, large, step = 1 }: Props) {
  const next = (v: number) => Math.round(v * 1000) / 1000
  return (
    <div role="group" aria-label={label} aria-labelledby={labelledBy} className={styles.group}>
      <IconButton
        icon="remover"
        label="Diminuir"
        tone="muted"
        disabled={value <= min}
        onClick={() => onChange(Math.max(min, next(value - step)))}
      />
      <div aria-live="polite" className={`${styles.value} ${large ? styles.large : ''}`}>
        {Number.isInteger(value) ? value : value.toLocaleString('pt-BR', { maximumFractionDigits: 3 })}
      </div>
      <IconButton icon="adicionar" label="Aumentar" tone="primary" onClick={() => onChange(next(value + step))} />
    </div>
  )
}
