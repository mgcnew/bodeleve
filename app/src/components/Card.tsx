import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Icon, type IconName } from './Icon'
import styles from './Card.module.css'

/** Cartão de lista (linhas com divisória) */
export function Box({ children }: { children: ReactNode }) {
  return <div className={styles.box}>{children}</div>
}

/** Cartão com conteúdo empilhado */
export function Panel({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <div className={styles.panel}>
      {title && <div className={styles.panelTitle}>{title}</div>}
      {children}
    </div>
  )
}

export function RowLink({ icon, title, sub, to }: { icon: IconName; title: string; sub?: string; to: string }) {
  return (
    <Link to={to} className={styles.rowLink}>
      <Icon name={icon} size={22} />
      <span className={styles.rowText}>
        <span className={styles.rowTitle}>{title}</span>
        {sub && <span className={styles.rowSub}>{sub}</span>}
      </span>
      <Icon name="avancar" size={18} />
    </Link>
  )
}

export function SummaryRow({ label, value }: { label: ReactNode; value: ReactNode }) {
  return (
    <div className={styles.summaryRow}>
      <span>{label}</span>
      <span>{value}</span>
    </div>
  )
}

export function SummaryTotal({ label = 'Total', value }: { label?: ReactNode; value: ReactNode }) {
  return (
    <div className={styles.summaryTotal}>
      <span>{label}</span>
      <span>{value}</span>
    </div>
  )
}
