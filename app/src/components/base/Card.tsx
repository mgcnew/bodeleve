import type { HTMLAttributes, ElementType } from 'react'
import { cx } from '@/lib/cx'
import s from './Card.module.css'

type CardProps = HTMLAttributes<HTMLElement> & {
  as?: ElementType
  /** `flush` = só respiro lateral, para listas de linhas separadas por divisor. */
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'flush'
}

/** Superfície branca com borda de 1 px e raio de 12 px. */
export function Card({ as: Tag = 'div', padding = 'md', className, ...rest }: CardProps) {
  return <Tag className={cx(s.card, padding !== 'none' && s[padding], className)} {...rest} />
}
