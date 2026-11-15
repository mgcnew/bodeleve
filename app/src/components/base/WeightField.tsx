import { useId, type ReactNode } from 'react'
import { Chip } from './Chip'
import s from './WeightField.module.css'

export type WeightShortcut = { label: string; kg: number }

type WeightFieldProps = {
  /** Texto digitado, como a pessoa vê ("0,500"). Quem usa converte com `parseDecimal`. */
  value: string
  onChange: (text: string) => void
  /** Atalhos de peso (H-P2: 250 g, 500 g, 1 kg). */
  shortcuts?: WeightShortcut[]
  /** Peso atual em kg, para marcar o atalho selecionado. */
  currentKg?: number | null
  onShortcut?: (kg: number) => void
  label?: string
  unit?: string
  /** Linha de resumo abaixo ("R$ 59,90 / kg · total R$ 29,95"). */
  summary?: ReactNode
}

export function WeightField({ value, onChange, shortcuts = [], currentKg, onShortcut, label = 'Peso', unit = 'kg', summary }: WeightFieldProps) {
  const id = useId()
  return (
    <div className={s.field}>
      <label htmlFor={id} className={s.label}>{label}</label>
      <div className={s.box}>
        <input id={id} type="text" inputMode="decimal" className={s.input} value={value} onChange={(e) => onChange(e.target.value)} />
        <span className={s.unit}>{unit}</span>
      </div>
      {shortcuts.length > 0 && (
        <div className={s.shortcuts}>
          {shortcuts.map((a) => (
            <Chip key={a.label} selected={currentKg != null && Math.abs(currentKg - a.kg) < 1e-9} onClick={() => onShortcut?.(a.kg)}>
              {a.label}
            </Chip>
          ))}
        </div>
      )}
      {summary && <div style={{ font: 'var(--apoio)', color: 'var(--texto-secundario)', fontVariantNumeric: 'tabular-nums' }}>{summary}</div>}
    </div>
  )
}
