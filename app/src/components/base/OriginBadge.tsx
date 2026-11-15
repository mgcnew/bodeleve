import { cx } from '@/lib/cx'
import s from './OriginBadge.module.css'

export type Origin = 'brand' | 'house' | 'resale'

const text: Record<Origin, string> = {
  brand: 'Marca Bodeleve',
  house: 'Feito na casa',
  resale: 'Revenda',
}

/** Selo de origem. "Marca Bodeleve" e "Feito na casa" aparecem na loja; "Revenda" só na gestão. */
export function OriginBadge({ origin }: { origin: Origin }) {
  return <span className={cx(s.badge, s[origin])}>{text[origin]}</span>
}
