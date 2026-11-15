import { useId, type InputHTMLAttributes } from 'react'
import { Icon } from '../Icon'
import s from './SearchField.module.css'

export type SearchFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'size'> & {
  /** Nome acessível do campo (fica oculto na tela; o ícone e o placeholder já comunicam a função). */
  label: string
}

export function SearchField({ label, id, placeholder, ...rest }: SearchFieldProps) {
  const auto = useId()
  const inputId = id ?? auto
  return (
    <div className={s.wrap}>
      <Icon name="buscar" size={20} />
      <label htmlFor={inputId} className="sr-only">{label}</label>
      <input id={inputId} type="search" className={s.input} placeholder={placeholder ?? label} {...rest} />
    </div>
  )
}
