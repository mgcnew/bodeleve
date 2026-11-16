import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { Link, type LinkProps } from 'react-router-dom'
import { Icon, type IconName } from './Icon'
import styles from './Button.module.css'

type Variant = 'primary' | 'secondary' | 'quiet' | 'danger'

type Look = {
  variant?: Variant
  /** l = 56 px: ação principal de rodapé, PDV e entregas */
  size?: 'm' | 'l'
  block?: boolean
  /** rótulo à esquerda e valor à direita (ex.: "Continuar · R$ 81,20") */
  spread?: boolean
}

function cls({ variant = 'primary', size = 'm', block, spread }: Look, extra?: string) {
  return [styles.btn, styles[variant], size === 'l' && styles.l, block && styles.block, spread && styles.spread, extra]
    .filter(Boolean)
    .join(' ')
}

type ButtonProps = Look & ButtonHTMLAttributes<HTMLButtonElement> & { loading?: boolean }

export function Button({ variant, size, block, spread, loading, children, className, ...rest }: ButtonProps) {
  return (
    <button
      type="button"
      className={cls({ variant, size, block, spread }, className)}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading && <span className={styles.spinner} aria-hidden="true" />}
      {children}
    </button>
  )
}

export function ButtonLink({ variant, size, block, spread, className, ...rest }: Look & LinkProps) {
  return <Link className={cls({ variant, size, block, spread }, className)} {...rest} />
}

type IconLook = { icon: IconName; label: string; tone?: 'plain' | 'primary' | 'muted' | 'outlined'; iconSize?: number }

function iconCls(tone: IconLook['tone']) {
  return [
    styles.icon,
    tone === 'primary' && styles.iconPrimary,
    tone === 'muted' && styles.iconMuted,
    tone === 'outlined' && styles.iconOutlined,
  ]
    .filter(Boolean)
    .join(' ')
}

/** Botão só de ícone: sempre com nome acessível (AUDIT.md) */
export function IconButton({
  icon,
  label,
  tone = 'plain',
  iconSize = 20,
  className,
  ...rest
}: IconLook & Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'>) {
  return (
    <button type="button" aria-label={label} className={`${iconCls(tone)} ${className ?? ''}`} {...rest}>
      <Icon name={icon} size={iconSize} />
    </button>
  )
}

export function IconLink({
  icon,
  label,
  tone = 'plain',
  iconSize = 24,
  children,
  className,
  ...rest
}: IconLook & Omit<LinkProps, 'children'> & { children?: ReactNode }) {
  return (
    <Link aria-label={label} className={`${iconCls(tone)} ${className ?? ''}`} {...rest}>
      <Icon name={icon} size={iconSize} />
      {children}
    </Link>
  )
}
