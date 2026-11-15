import type { ReactNode } from 'react'
import { cx } from '@/lib/cx'
import s from './DeliveryStep.module.css'

type DeliveryStepProps = {
  step: number
  total: number
  title: string
  /** Uma ação principal e, se couber, uma secundária discreta ("Problema na entrega"). */
  children?: ReactNode
}

/** Etapa da entrega, uma ação por vez. "Etapa 3 de 4" em texto, além das barras. */
export function DeliveryStep({ step, total, title, children }: DeliveryStepProps) {
  return (
    <div className={s.box}>
      <div className={s.bars} aria-hidden="true">
        {Array.from({ length: total }, (_, i) => (
          <span key={i} className={cx(s.bar, i + 1 < step && s.done, i + 1 === step && s.current)} />
        ))}
      </div>
      <div>
        <div className={s.count}>Etapa {step} de {total}</div>
        <h3 className={s.title}>{title}</h3>
      </div>
      {children}
    </div>
  )
}
