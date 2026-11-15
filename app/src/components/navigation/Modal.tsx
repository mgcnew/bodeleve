import { useEffect, useId, useRef, type ReactNode } from 'react'
import s from './Modal.module.css'

type ModalProps = {
  open: boolean
  title: string
  description?: string
  /** Chamado ao apertar Esc: equivale à opção segura ("Continuar vendendo"). Tocar fora NÃO fecha. */
  onCancel: () => void
  /** Botões de ação, empilhados. Ponha a ação destrutiva primeiro e a segura por último, como no quadro. */
  children: ReactNode
}

/** Confirmação crítica (cancelar venda, fechar caixa). Exige uma escolha explícita. */
export function Modal({ open, title, description, onCancel, children }: ModalProps) {
  const ref = useRef<HTMLDialogElement>(null)
  const titleId = useId()
  const descId = useId()
  useEffect(() => {
    const dlg = ref.current
    if (!dlg) return
    if (open && !dlg.open) dlg.showModal()
    if (!open && dlg.open) dlg.close()
  }, [open])
  return (
    <dialog
      ref={ref}
      role="alertdialog"
      className={s.dialog}
      aria-labelledby={titleId}
      aria-describedby={description ? descId : undefined}
      onCancel={(e) => { e.preventDefault(); onCancel() }}
    >
      <div className={s.panel}>
        <h2 id={titleId} className={s.title}>{title}</h2>
        {description && <p id={descId} className={s.description}>{description}</p>}
        <div className={s.actions}>{open && children}</div>
      </div>
    </dialog>
  )
}
