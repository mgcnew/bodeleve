import type { ReactNode } from 'react'
import s from './BagItem.module.css'

type BagItemProps = {
  name: string
  /** "1 kg · R$ 12,90" */
  detail: string
  /** "× 2", um QuantityStepper ou o subtotal. */
  trailing: ReactNode
  /** Subtotal da linha, em destaque sob o detalhe (tela da sacola). */
  subtotal?: string
  /** Foto de 56 px (sacola) em vez de 64 px. */
  compact?: boolean
}

/** Item na sacola. */
export function BagItem({ name, detail, trailing, subtotal, compact }: BagItemProps) {
  return (
    <div className={s.item}>
      <div role="img" aria-label="Espaço para foto do produto" className={s.photo} style={compact ? { width: 56, height: 56 } : undefined}>{compact ? null : '[FOTO]'}</div>
      <div className={s.body}>
        <div className={s.name}>{name}</div>
        <div className={s.detail}>{detail}</div>
        {subtotal && <div className={s.trailing}>{subtotal}</div>}
      </div>
      <div className={subtotal ? undefined : s.trailing}>{trailing}</div>
    </div>
  )
}
