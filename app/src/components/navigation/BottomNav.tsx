import { cx } from '@/lib/cx'
import { Icon, type IconName } from '../Icon'
import s from './BottomNav.module.css'

export type NavItem = {
  label: string
  icon: IconName
  href: string
  active?: boolean
  onClick?: React.MouseEventHandler<HTMLAnchorElement>
}

/** Barra inferior: 3 a 5 destinos de mesmo peso, ícone + rótulo. Some em checkout, pagamento e entrega em rota. */
export function BottomNav({ items, label = 'Navegação principal' }: { items: NavItem[]; label?: string }) {
  return (
    <nav aria-label={label} className={s.nav}>
      {items.map((it) => (
        <a key={it.label} href={it.href} onClick={it.onClick} aria-current={it.active ? 'page' : undefined} className={cx(s.item, it.active && s.active)}>
          <Icon name={it.icon} />
          <span>{it.label}</span>
        </a>
      ))}
    </nav>
  )
}
