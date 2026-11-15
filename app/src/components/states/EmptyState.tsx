import type { ReactNode } from 'react'
import { cx } from '@/lib/cx'
import { Icon, type IconName } from '../Icon'
import s from './EmptyState.module.css'

type StateProps = {
  icon: IconName
  title: string
  description?: string
  /** O próximo passo: um Button. */
  action?: ReactNode
}

/** Vazio: diz o que vai aparecer ali e oferece o próximo passo. */
export function EmptyState({ icon, title, description, action }: StateProps) {
  return (
    <div className={s.box}>
      <div className={s.disc} aria-hidden="true"><Icon name={icon} size={28} /></div>
      <h2 className={s.title}>{title}</h2>
      {description && <p className={s.text}>{description}</p>}
      {action}
    </div>
  )
}

/** Falha ao carregar: diz o que houve, o que não mudou e como seguir. */
export function ErrorState({ title, description, action }: Omit<StateProps, 'icon'>) {
  return (
    <div role="alert" className={cx(s.box, s.error)}>
      <div className={s.disc} aria-hidden="true"><Icon name="alerta" size={28} /></div>
      <h2 className={s.title}>{title}</h2>
      {description && <p className={s.text}>{description}</p>}
      {action}
    </div>
  )
}
