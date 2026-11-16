import { Outlet } from 'react-router-dom'
import { BottomNav, type NavDestination } from './BottomNav'
import styles from './EnvLayout.module.css'

type Props = {
  /** fundo.loja (creme) só na loja; operação nos demais (P-C) */
  background: 'loja' | 'operacao'
  nav: NavDestination[]
}

export function EnvLayout({ background, nav }: Props) {
  return (
    <div
      className={styles.shell}
      style={{ background: background === 'loja' ? 'var(--fundo-loja)' : 'var(--fundo-operacao)' }}
    >
      <main className={styles.main}>
        <Outlet />
      </main>
      <div className={styles.bottom}>
        <BottomNav items={nav} />
      </div>
    </div>
  )
}
