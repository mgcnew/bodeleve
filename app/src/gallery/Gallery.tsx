import { ToastProvider } from '@/components'
import { Fundamentos } from './Fundamentos'
import { Base } from './Base'
import { Navegacao } from './Navegacao'
import { Dominio } from './Dominio'
import { Estados } from './Estados'
import s from './gallery.module.css'

/** Catálogo interno do design system (Etapa 2). Compare cada bloco com os quadros DS-* em design/. */
export function Gallery() {
  return (
    <ToastProvider>
      <div className={s.page}>
        <header className={s.top}>
          <div className={s.topInner}>
            <span className={s.brand}>Bodeleve</span>
            <nav className={s.nav} aria-label="Seções do design system">
              <a href="#fundamentos">Fundamentos</a>
              <a href="#base">Base</a>
              <a href="#navegacao">Navegação</a>
              <a href="#dominio">Domínio</a>
              <a href="#estados">Estados</a>
            </nav>
          </div>
        </header>
        <main className={s.main}>
          <div className={s.intro}>
            <div className={s.eyebrow}>Etapa 2 · Design system em componentes</div>
            <h1 className={s.h1}>Catálogo de componentes</h1>
            <p className={s.lead}>Cada bloco corresponde a um quadro DS-* do canvas. Valores e nomes são fictícios. Os componentes usam apenas os tokens de design/tokens.css.</p>
          </div>
          <Fundamentos />
          <Base />
          <Navegacao />
          <Dominio />
          <Estados />
        </main>
      </div>
    </ToastProvider>
  )
}
