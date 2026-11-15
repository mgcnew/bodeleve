import { useId, useRef, type ClipboardEvent, type KeyboardEvent } from 'react'
import { cx } from '@/lib/cx'
import s from './ConfirmationCode.module.css'

type ConfirmationCodeProps = {
  /** Dígitos digitados até agora (só números). */
  value: string
  onChange: (value: string) => void
  length?: number
  label?: string
  invalid?: boolean
}

/** Código de confirmação de entrega (H-E5): 4 dígitos informados pelo cliente. Avança sozinho, volta no apagar e aceita colar. */
export function ConfirmationCode({ value, onChange, length = 4, label = 'Código informado pelo cliente', invalid }: ConfirmationCodeProps) {
  const labelId = useId()
  const refs = useRef<Array<HTMLInputElement | null>>([])
  const focus = (i: number) => refs.current[Math.max(0, Math.min(length - 1, i))]?.focus()

  const setDigit = (i: number, raw: string) => {
    const digits = raw.replace(/\D/g, '')
    if (!digits) return
    const chars = value.padEnd(length, ' ').split('')
    chars[i] = digits[digits.length - 1]
    onChange(chars.join('').replace(/\s+$/, '').replace(/ /g, ''))
    focus(i + 1)
  }
  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>, i: number) => {
    if (e.key === 'Backspace') {
      e.preventDefault()
      if (value[i]) onChange(value.slice(0, i) + value.slice(i + 1))
      else { onChange(value.slice(0, Math.max(0, i - 1)) + value.slice(i)); focus(i - 1) }
    } else if (e.key === 'ArrowLeft') focus(i - 1)
    else if (e.key === 'ArrowRight') focus(i + 1)
  }
  const onPaste = (e: ClipboardEvent) => {
    const digits = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length)
    if (!digits) return
    e.preventDefault()
    onChange(digits)
    focus(digits.length)
  }

  return (
    <div className={s.box}>
      <div id={labelId} className={s.label}>{label}</div>
      <div role="group" aria-labelledby={labelId} className={s.grid} style={{ ['--digits' as string]: length }}>
        {Array.from({ length }, (_, i) => (
          <input
            key={i}
            ref={(el) => { refs.current[i] = el }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            autoComplete={i === 0 ? 'one-time-code' : 'off'}
            aria-label={`Dígito ${i + 1}`}
            aria-invalid={invalid || undefined}
            className={cx(s.digit, invalid && s.error)}
            value={value[i] ?? ''}
            onChange={(e) => setDigit(i, e.target.value)}
            onKeyDown={(e) => onKeyDown(e, i)}
            onPaste={onPaste}
            onFocus={(e) => e.target.select()}
          />
        ))}
      </div>
    </div>
  )
}
