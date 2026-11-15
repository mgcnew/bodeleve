import { cx } from '@/lib/cx'
import s from './PaymentMethods.module.css'

type Method<T extends string> = { value: T; label: string }

type PaymentMethodsProps<T extends string> = {
  methods: Method<T>[]
  value: T | null
  onChange: (value: T) => void
  label?: string
}

/** Formas de pagamento do PDV (H-P3: dinheiro, Pix, débito, crédito). Selecionada = borda grafite de 2 px + aria-pressed. */
export function PaymentMethods<T extends string>({ methods, value, onChange, label = 'Forma de pagamento' }: PaymentMethodsProps<T>) {
  return (
    <div role="group" aria-label={label} className={s.grid}>
      {methods.map((m) => (
        <button key={m.value} type="button" aria-pressed={m.value === value} className={cx(s.method, m.value === value && s.on)} onClick={() => onChange(m.value)}>
          {m.label}
        </button>
      ))}
    </div>
  )
}
