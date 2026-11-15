import { cx } from '@/lib/cx'
import { AppLink } from '../AppLink'
import { Icon } from '../Icon'
import type { NavItem } from './BottomNav'
import s from './SideMenu.module.css'

/** Menu lateral da gestão a partir de 768 px: a barra inferior vira esta lista com os 12 módulos. */
export function SideMenu({ items, brand = 'Bodeleve' }: { items: NavItem[]; brand?: string }) {
  return (
    <nav aria-label="Menu lateral" className={s.nav}>
      <div className={s.brand}>{brand}</div>
      {items.map((it) => (
        <AppLink key={it.label} href={it.href} onClick={it.onClick} aria-current={it.active ? 'page' : undefined} className={cx(s.item, it.active && s.active)}>
          <Icon name={it.icon} size={20} />
          <span>{it.label}</span>
        </AppLink>
      ))}
    </nav>
  )
}
