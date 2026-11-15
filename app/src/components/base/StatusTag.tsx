import type { HTMLAttributes } from 'react'
import { cx } from '@/lib/cx'
import s from './StatusTag.module.css'

export type Tone = 'success' | 'warning' | 'error' | 'info' | 'neutral'

type StatusTagProps = HTMLAttributes<HTMLSpanElement> & { tone?: Tone }

/** Etiqueta de status: texto curto + cor de apoio. O texto sempre diz o estado (cor nunca é o único sinal). */
export function StatusTag({ tone = 'neutral', className, ...rest }: StatusTagProps) {
  return <span className={cx(s.tag, s[tone], className)} {...rest} />
}
