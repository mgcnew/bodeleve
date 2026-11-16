import { useEffect, useRef, type ReactNode } from 'react'
import styles from './Sheet.module.css'

type Props = {
  open: boolean
  onClose: () => void
  title: string
  /** modal central para confirmações críticas; folha para escolhas curtas */
  variant?: 'sheet' | 'modal'
  children: ReactNode
}

/** Folha ou modal sobre <dialog>: foco preso, Esc fecha, fundo escurecido */
export function Sheet({ open, onClose, title, variant = 'sheet', children }: Props) {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const d = ref.current
    if (!d) return
    if (open && !d.open) d.showModal()
    if (!open && d.open) d.close()
  }, [open])

  return (
    <dialog
      ref={ref}
      className={`${styles.dialog} ${variant === 'modal' ? styles.modal : styles.sheet}`}
      aria-label={title}
      role={variant === 'modal' ? 'alertdialog' : 'dialog'}
      onClose={onClose}
      onClick={(e) => {
        if (e.target === ref.current) onClose()
      }}
    >
      {open && (
        <div className={styles.body}>
          {variant === 'sheet' && <div className={styles.grip} aria-hidden="true" />}
          <h2 className={styles.title}>{title}</h2>
          {children}
        </div>
      )}
    </dialog>
  )
}
