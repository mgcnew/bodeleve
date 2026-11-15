import type { ReactNode } from 'react'
import { IconButton } from '../base/IconButton'
import s from './TopBar.module.css'

type TopBarProps = {
  title: string
  /** Mostra o botão voltar. */
  onBack?: () => void
  /** Botões de ícone à direita (use IconButton com variant="plain"). */
  actions?: ReactNode
  /** Nível do título. Cada tela tem um único h1 (padrão); use h2/h3 quando a barra for só parte de outra tela. */
  titleAs?: 'h1' | 'h2' | 'h3' | 'h4'
}

export function TopBar({ title, onBack, actions, titleAs: Title = 'h1' }: TopBarProps) {
  return (
    <header className={s.bar}>
      {onBack ? <IconButton icon="voltar" label="Voltar" variant="plain" onClick={onBack} /> : <span className={s.spacer} />}
      <Title className={s.title}>{title}</Title>
      {actions && <div className={s.actions}>{actions}</div>}
    </header>
  )
}
