import type { ReactNode } from 'react'
import s from './BagItem.module.css'

type BagItemProps = {
  name: string
  /** "1 kg · R$ 12,90" */
  detail: string
  /** "× 2", um QuantityStepper ou o subtotal. */
  trailing: ReactNode
}

/** Item na sacola. */
export function BagItem({ name, detail, trailing }: BagItemProps) {
  return (
    <div className={s.item}>
      <div role="img" aria-label="Espaço para foto do produto" className={s.photo}>[FOTO]</div>
      <div className={s.body}>
        <div className={s.name}>{name}</div>
        <div className={s.detail}>{detail}</div>
      </div>
      <div className={s.trailing}>{trailing}</div>
    </div>
  )
}
