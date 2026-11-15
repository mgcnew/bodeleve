import { useRef, type KeyboardEvent } from 'react'
import { cx } from '@/lib/cx'
import s from './Tabs.module.css'

type Tab<T extends string> = { value: T; label: string }

type TabsProps<T extends string> = {
  tabs: Tab<T>[]
  value: T
  onChange: (value: T) => void
  label: string
  /** Prefixo dos ids (`${idPrefix}-tab-${value}`). O painel de cada aba deve ter id `${idPrefix}-panel-${value}` e aria-labelledby apontando para a aba. */
  idPrefix?: string
  /** Marque quando existirem painéis com os ids acima; só então as abas declaram aria-controls. */
  hasPanels?: boolean
}

/** Abas (PDV: Favoritos · Categorias · Buscar). Setas, Home e End movem a seleção. */
export function Tabs<T extends string>({ tabs, value, onChange, label, idPrefix = 'tabs', hasPanels = false }: TabsProps<T>) {
  const refs = useRef<Array<HTMLButtonElement | null>>([])
  const onKeyDown = (e: KeyboardEvent, index: number) => {
    let next = index
    if (e.key === 'ArrowRight') next = (index + 1) % tabs.length
    else if (e.key === 'ArrowLeft') next = (index - 1 + tabs.length) % tabs.length
    else if (e.key === 'Home') next = 0
    else if (e.key === 'End') next = tabs.length - 1
    else return
    e.preventDefault()
    onChange(tabs[next].value)
    refs.current[next]?.focus()
  }
  return (
    <div role="tablist" aria-label={label} className={s.list}>
      {tabs.map((t, i) => {
        const selected = t.value === value
        return (
          <button
            key={t.value}
            ref={(el) => { refs.current[i] = el }}
            id={`${idPrefix}-tab-${t.value}`}
            type="button"
            role="tab"
            aria-selected={selected}
            aria-controls={hasPanels ? `${idPrefix}-panel-${t.value}` : undefined}
            tabIndex={selected ? 0 : -1}
            className={cx(s.tab, selected && s.on)}
            onClick={() => onChange(t.value)}
            onKeyDown={(e) => onKeyDown(e, i)}
          >
            {t.label}
          </button>
        )
      })}
    </div>
  )
}
