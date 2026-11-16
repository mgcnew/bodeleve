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
    // O contêiner inteiro é o rótulo: tocar em qualquer ponto da caixa (44 px) foca o campo, não só nos 26 px do texto.
    <label htmlFor={inputId} className={s.wrap}>
      <Icon name="buscar" size={20} />
      <input id={inputId} type="search" aria-label={label} className={s.input} placeholder={placeholder ?? label} {...rest} />
    </label>
  )
}
