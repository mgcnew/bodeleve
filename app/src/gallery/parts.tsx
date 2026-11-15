import type { ReactNode } from 'react'
import s from './gallery.module.css'

export function Section({ id, title, note, children }: { id: string; title: string; note?: string; children: ReactNode }) {
  return (
    <section id={id} className={s.section} aria-labelledby={`${id}-h`}>
      <div className={s.sectionHead}>
        <h2 id={`${id}-h`} className={s.h2}>{title}</h2>
        {note && <p className={s.sectionNote}>{note}</p>}
      </div>
      {children}
    </section>
  )
}

export function Panel({ title, note, children }: { title: string; note?: string; children: ReactNode }) {
  return (
    <div className={s.panel}>
      <h3 className={s.h3}>{title}</h3>
      {note && <p className={s.panelNote}>{note}</p>}
      {children}
    </div>
  )
}

export function Legend({ children }: { children: ReactNode }) {
  return <div className={s.legend}>{children}</div>
}
