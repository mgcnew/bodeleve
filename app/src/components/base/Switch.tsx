import { useId } from 'react'
import { cx } from '@/lib/cx'
import s from './Switch.module.css'

type SwitchProps = {
  checked: boolean
  onChange: (next: boolean) => void
  label: string
  disabled?: boolean
}

/** Liga/desliga. O estado fica em `aria-checked` e na posição do botão, não só na cor. */
export function Switch({ checked, onChange, label, disabled }: SwitchProps) {
  const labelId = useId()
  return (
    <div className={cx(s.row, checked && s.on)}>
      <span id={labelId}>{label}</span>
      <button type="button" role="switch" aria-checked={checked} aria-labelledby={labelId} disabled={disabled} className={s.hit} onClick={() => onChange(!checked)}>
        <span className={s.track} aria-hidden="true"><span className={s.thumb} /></span>
      </button>
    </div>
  )
}
