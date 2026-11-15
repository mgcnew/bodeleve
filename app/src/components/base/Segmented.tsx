import { cx } from '@/lib/cx'
import s from './Segmented.module.css'

type Option<T extends string> = { value: T; label: string }

type SegmentedProps<T extends string> = {
  options: Option<T>[]
  value: T
  onChange: (value: T) => void
  /** Nome do grupo para leitor de tela, p. ex. "Tipo de entrega". */
  label: string
}

/** Controle segmentado de escolha única (entrega/retirada, disponíveis/minhas). */
export function Segmented<T extends string>({ options, value, onChange, label }: SegmentedProps<T>) {
  return (
    <div role="group" aria-label={label} className={s.group}>
      {options.map((o) => (
        <button key={o.value} type="button" aria-pressed={o.value === value} className={cx(s.opt, o.value === value && s.on)} onClick={() => onChange(o.value)}>
          {o.label}
        </button>
      ))}
    </div>
  )
}
