import type { ReactNode } from 'react'
import s from './AuthLayout.module.css'

/** Moldura das telas de entrada: faixa da marca no celular, duas colunas no computador */
export function AuthLayout({ area, children }: { area: string; children: ReactNode }) {
  return (
    <div className={s.page}>
      <div className={s.brandPanel}>
        <div className={s.brand}>Bodeleve</div>
        <div className={s.area}>{area}</div>
      </div>
      <main className={s.panel}>
        <div className={`${s.inner} entra`}>{children}</div>
      </main>
    </div>
  )
}
