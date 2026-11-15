import type { ReactNode } from 'react'
import { Icon } from '../Icon'
import { StatusTag } from '../base/StatusTag'
import s from './DeliveryCard.module.css'

type DeliveryCardProps = {
  title: string
  courierKind: 'own' | 'partner'
  place: string
  address: string
  metrics: Array<{ label: string; value: string }>
  /** Ação principal (Button size="lg" fullWidth). */
  action?: ReactNode
}

/** Cartão de entrega do entregador. Próprio × parceiro vai em etiqueta de texto. */
export function DeliveryCard({ title, courierKind, place, address, metrics, action }: DeliveryCardProps) {
  return (
    <article className={s.card}>
      <div className={s.head}>
        <h3 className={s.title}>{title}</h3>
        <StatusTag tone="neutral">{courierKind === 'own' ? 'Próprio' : 'Parceiro'}</StatusTag>
      </div>
      <div className={s.where}>
        <Icon name="local" size={20} />
        <div>
          <div className={s.place}>{place}</div>
          <div className={s.address}>{address}</div>
        </div>
      </div>
      <dl className={s.metrics}>
        {metrics.map((m) => (
          <div key={m.label}><dt>{m.label}</dt><dd>{m.value}</dd></div>
        ))}
      </dl>
      {action}
    </article>
  )
}
