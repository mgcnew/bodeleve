import { formatBRL } from '@/lib/format'
import { AppLink } from '../AppLink'
import { Icon } from '../Icon'
import s from './BagBar.module.css'

type BagBarProps = { itemCount: number; totalCents: number; href: string; onClick?: React.MouseEventHandler<HTMLAnchorElement> }

/** Barra fixa da sacola na loja; só aparece quando há itens. */
export function BagBar({ itemCount, totalCents, href, onClick }: BagBarProps) {
  if (itemCount <= 0) return null
  return (
    <AppLink href={href} onClick={onClick} className={s.bar}>
      <Icon name="sacola" />
      <span className={s.text}>Ver sacola · {itemCount} {itemCount === 1 ? 'item' : 'itens'}</span>
      <span className={s.total}>{formatBRL(totalCents)}</span>
    </AppLink>
  )
}
