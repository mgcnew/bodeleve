import { useId, type InputHTMLAttributes, type ReactNode } from 'react'
import s from './ChoiceOption.module.css'

type ChoiceOptionProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'children'> & {
  type: 'radio' | 'checkbox'
  children: ReactNode
}

/** Opção única (radio) ou múltipla (caixa de seleção) com o rótulo inteiro clicável e alvo de 48 px. */
export function ChoiceOption({ type, children, id, ...rest }: ChoiceOptionProps) {
  const auto = useId()
  const inputId = id ?? auto
  return (
    <label htmlFor={inputId} className={s.option}>
      <input id={inputId} type={type} className={s.input} {...rest} />
      <span>{children}</span>
    </label>
  )
}
