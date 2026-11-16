import { NavLink } from 'react-router-dom'
import { Icon, type IconName } from './Icon'
import styles from './BottomNav.module.css'

export type NavDestination = { to: string; label: string; icon: IconName; end?: boolean }

export function BottomNav({ items }: { items: NavDestination[] }) {
  return (
    <nav aria-label="Navegação principal" className={styles.nav}>
      {items.map((item) => (
        <NavLink key={item.to} to={item.to} end={item.end} className={styles.item}>
          <Icon name={item.icon} />
          <span>{item.label}</span>
        </NavLink>
      ))}
    </nav>
  )
}
