import { cx } from '@/lib/cx'
import { AppLink, type AppLinkProps } from '../AppLink'
import type { ButtonProps } from './Button'
import s from './Button.module.css'

type ButtonLinkProps = AppLinkProps & Pick<ButtonProps, 'variant' | 'size' | 'fullWidth'>

/** Link com a aparência de botão (navegação, não ação). Mesmas variantes e tamanhos do Button. */
export function ButtonLink({ variant = 'primary', size = 'md', fullWidth, className, ...rest }: ButtonLinkProps) {
  return <AppLink className={cx(s.button, s[variant], size === 'lg' && s.lg, fullWidth && s.full, className)} {...rest} />
}
