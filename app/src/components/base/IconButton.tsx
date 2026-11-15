import type { ButtonHTMLAttributes } from 'react'
import { cx } from '@/lib/cx'
import { Icon, type IconName } from '../Icon'
import s from './IconButton.module.css'

export type IconButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children' | 'aria-label'> & {
  icon: IconName
  /** Obrigatório: botão só de ícone sempre tem nome acessível. */
  label: string
  variant?: 'primary' | 'outline' | 'plain'
  /** `dense` = 44 px (mínimo de toque; cartões de produto), padrão 48 px. */
  dense?: boolean
}

export function IconButton({ icon, label, variant = 'outline', dense, className, type = 'button', ...rest }: IconButtonProps) {
  return (
    <button type={type} aria-label={label} className={cx(s.btn, s[variant], dense && s.dense, className)} {...rest}>
      <Icon name={icon} size={dense ? 20 : 24} />
    </button>
  )
}
