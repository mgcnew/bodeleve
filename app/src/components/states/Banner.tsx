import type { ReactNode } from 'react'
import { cx } from '@/lib/cx'
import { Icon, type IconName } from '../Icon'
import s from './Banner.module.css'

type BannerProps = {
  tone: 'warning' | 'error' | 'success'
  children: ReactNode
  /** Padrão: alerta (aviso/erro) ou confirmar (sucesso). Use "sem-conexao" para falta de rede. */
  icon?: IconName
}

const defaultIcon: Record<BannerProps['tone'], IconName> = { warning: 'alerta', error: 'alerta', success: 'confirmar' }

/** Faixa de aviso dentro da tela. Sempre com ícone e texto: cor nunca é o único sinal. */
export function Banner({ tone, icon, children }: BannerProps) {
  return (
    <div role="status" className={cx(s.banner, s[tone])}>
      <Icon name={icon ?? defaultIcon[tone]} size={20} />
      <span>{children}</span>
    </div>
  )
}
