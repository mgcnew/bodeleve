import type { ReactNode } from 'react'
import type { ProductOrigin } from '@/domain/catalog'
import styles from './Badges.module.css'

const sealLabels: Record<ProductOrigin, string> = {
  house_made: 'Feito na casa',
  bodeleve_brand: 'Marca Bodeleve',
  third_party: 'Revenda',
}

/** Selo de origem. "Revenda" só aparece na gestão (DESIGN_SYSTEM.md). */
export function Seal({ origin }: { origin: ProductOrigin }) {
  return <span className={`${styles.seal} ${styles[origin]}`}>{sealLabels[origin]}</span>
}

export type Tone = 'success' | 'warning' | 'error' | 'info'

/** Etiqueta de status: o texto sempre diz o estado; a cor reforça */
export function Tag({ tone, children }: { tone: Tone; children: ReactNode }) {
  return <span className={`${styles.tag} ${styles[tone]}`}>{children}</span>
}
