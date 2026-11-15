import { useId, type InputHTMLAttributes, type ReactNode } from 'react'
import { cx } from '@/lib/cx'
import { Icon } from '../Icon'
import s from './TextField.module.css'

export type TextFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> & {
  /** Rótulo sempre visível acima do campo (DESIGN_SYSTEM.md). */
  label: string
  hint?: ReactNode
  /** Mensagem de erro: diga como corrigir ("Use dia/mês/ano."). O ícone garante que cor não é o único sinal. */
  error?: string
}

export function TextField({ label, hint, error, id, className, ...rest }: TextFieldProps) {
  const auto = useId()
  const inputId = id ?? auto
  const hintId = `${inputId}-hint`
  const errorId = `${inputId}-error`
  const describedBy = error ? errorId : hint ? hintId : undefined
  return (
    <div className={cx(s.field, className)}>
      <label htmlFor={inputId} className={s.label}>{label}</label>
      <input
        id={inputId}
        type="text"
        className={cx(s.input, error && s.invalid)}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        {...rest}
      />
      {error ? (
        <div id={errorId} className={s.error}><Icon name="alerta" size={16} />{error}</div>
      ) : hint ? (
        <div id={hintId} className={s.hint}>{hint}</div>
      ) : null}
    </div>
  )
}
