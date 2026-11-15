import type { ButtonHTMLAttributes } from 'react'
import { cx } from '@/lib/cx'
import s from './Button.module.css'

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  /** Terracota é reservada à ação principal da tela: no máximo um `primary` por tela. */
  variant?: 'primary' | 'secondary' | 'ghost' | 'destructive'
  /** `md` = 48 px; `lg` = 56 px (rodapé, PDV, entregas). */
  size?: 'md' | 'lg'
  fullWidth?: boolean
  /** Ação em andamento: mostra o indicador no próprio botão e ignora novos toques. Passe o texto de andamento em `children` ("Enviando…"). */
  loading?: boolean
}

export function Button({ variant = 'primary', size = 'md', fullWidth, loading, className, type = 'button', onClick, children, ...rest }: ButtonProps) {
  return (
    <button
      type={type}
      className={cx(s.button, s[variant], size === 'lg' && s.lg, fullWidth && s.full, loading && s.loading, className)}
      aria-busy={loading || undefined}
      onClick={loading ? undefined : onClick}
      {...rest}
    >
      {loading && <span className={s.spinner} aria-hidden="true" />}
      {children}
    </button>
  )
}
