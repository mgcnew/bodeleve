import type { CSSProperties, ReactNode } from 'react'
import { Icon, type IconName } from './Icon'
import type { Tone } from './Badges'
import styles from './Feedback.module.css'

const bannerIcons: Record<Tone, IconName> = {
  success: 'confirmar',
  warning: 'alerta',
  error: 'alerta',
  info: 'alerta',
}

/** Faixa de aviso: ícone + texto, nunca só cor */
export function Banner({ tone, icon, children }: { tone: Tone; icon?: IconName; children: ReactNode }) {
  return (
    <div role={tone === 'error' ? 'alert' : 'status'} className={`${styles.banner} ${styles[tone]}`}>
      <Icon name={icon ?? bannerIcons[tone]} size={20} />
      <span>{children}</span>
    </div>
  )
}

type StateProps = {
  icon: IconName
  title: string
  text?: string
  action?: ReactNode
  /** sem cartão, centralizado na tela */
  bare?: boolean
}

/** Vazio: diz o que vai aparecer ali e oferece o próximo passo */
export function EmptyState({ icon, title, text, action, bare }: StateProps) {
  return (
    <div className={`${styles.state} ${bare ? styles.bare : ''}`}>
      <div aria-hidden="true" className={styles.stateIcon}>
        <Icon name={icon} size={28} />
      </div>
      <h2 className={styles.stateTitle}>{title}</h2>
      {text && <p className={styles.stateText}>{text}</p>}
      {action}
    </div>
  )
}

/** Falha ao carregar: diz o que houve, o que não mudou e como seguir */
export function ErrorState({ title, text, action }: Omit<StateProps, 'icon' | 'bare'>) {
  return (
    <div role="alert" className={styles.state}>
      <div aria-hidden="true" className={`${styles.stateIcon} ${styles.err}`}>
        <Icon name="alerta" size={28} />
      </div>
      <h2 className={styles.stateTitle}>{title}</h2>
      {text && <p className={styles.stateText}>{text}</p>}
      {action}
    </div>
  )
}

export function Skeleton({ width, height = 14, radius, style }: { width: string; height?: number; radius?: number; style?: CSSProperties }) {
  return <div className={styles.skeleton} style={{ width, height, borderRadius: radius, ...style }} />
}
