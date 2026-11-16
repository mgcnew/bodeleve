import { useId, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes } from 'react'
import { Icon } from './Icon'
import styles from './Field.module.css'

type TextFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string
  help?: string
  /** diz como corrigir (DESIGN_SYSTEM.md) */
  error?: string
}

/** Rótulo sempre visível acima do campo */
export function TextField({ label, help, error, id, ...rest }: TextFieldProps) {
  const auto = useId()
  const fid = id ?? auto
  const describedBy = error ? `${fid}-erro` : help ? `${fid}-ajuda` : undefined
  return (
    <div className={styles.field}>
      <label htmlFor={fid} className={styles.label}>
        {label}
      </label>
      <input
        id={fid}
        className={styles.input}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        {...rest}
      />
      {error ? (
        <div id={`${fid}-erro`} className={styles.error}>
          <Icon name="alerta" size={16} />
          {error}
        </div>
      ) : (
        help && (
          <div id={`${fid}-ajuda`} className={styles.help}>
            {help}
          </div>
        )
      )}
    </div>
  )
}

export type Choice<T extends string> = { value: T; title: string; sub?: string; aside?: ReactNode }

export function RadioGroup<T extends string>({
  legend,
  name,
  options,
  value,
  onChange,
}: {
  legend: string
  name: string
  options: Choice<T>[]
  value: T | null
  onChange: (value: T) => void
}) {
  return (
    <fieldset className={styles.fieldset}>
      <legend className={styles.legend}>{legend}</legend>
      {options.map((o) => (
        <label key={o.value} className={styles.option}>
          <input
            type="radio"
            name={name}
            className={styles.radio}
            checked={value === o.value}
            onChange={() => onChange(o.value)}
          />
          <span className={styles.optionText}>
            <span className={styles.optionTitle}>{o.title}</span>
            {o.sub && <span className={styles.optionSub}>{o.sub}</span>}
          </span>
          {o.aside && <span className={styles.optionAside}>{o.aside}</span>}
        </label>
      ))}
    </fieldset>
  )
}

export function Segmented<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string
  options: { value: T; label: string }[]
  value: T
  onChange: (value: T) => void
}) {
  return (
    <div role="group" aria-label={label} className={styles.segmented}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          className={styles.segment}
          aria-pressed={value === o.value}
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

export function FilterChips<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string
  options: { value: T; label: string }[]
  value: T
  onChange: (value: T) => void
}) {
  return (
    <div role="group" aria-label={label} className={styles.chips}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          className={styles.chip}
          aria-pressed={value === o.value}
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

export function SelectField({
  label,
  options,
  id,
  ...rest
}: SelectHTMLAttributes<HTMLSelectElement> & { label: string; options: { value: string; label: string }[] }) {
  const auto = useId()
  const fid = id ?? auto
  return (
    <div className={styles.field}>
      <label htmlFor={fid} className={styles.label}>
        {label}
      </label>
      <select id={fid} className={`${styles.input} ${styles.select}`} {...rest}>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  )
}

export const chipClass = styles.chip
