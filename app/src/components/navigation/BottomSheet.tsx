/* Tocar no fundo escurecido (::backdrop, cujo alvo é o próprio <dialog>) fecha a folha. Não é um controle novo: o equivalente
   por teclado é Esc, tratado em onCancel, então a regra abaixo não se aplica a este clique. */
/* eslint-disable jsx-a11y/click-events-have-key-events, jsx-a11y/no-noninteractive-element-interactions */
import { useEffect, useId, useRef, type PointerEvent, type ReactNode } from 'react'
import s from './BottomSheet.module.css'

type BottomSheetProps = {
  open: boolean
  onClose: () => void
  title: string
  description?: string
  children: ReactNode
}

const CLOSE_DISTANCE = 80

/**
 * Folha de baixo para escolhas curtas ligadas à tela (peso, desconto, sangria).
 * Fecha ao arrastar para baixo, ao tocar fora e com Esc. Nunca para confirmação crítica nem para vários passos (use Modal).
 * Pendência (Etapa 3, com o roteador): fechar também com o botão voltar do aparelho.
 */
export function BottomSheet({ open, onClose, title, description, children }: BottomSheetProps) {
  const ref = useRef<HTMLDialogElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const drag = useRef<{ startY: number; dy: number } | null>(null)
  const titleId = useId()
  const descId = useId()

  useEffect(() => {
    const dlg = ref.current
    if (!dlg) return
    if (open && !dlg.open) dlg.showModal()
    if (!open && dlg.open) dlg.close()
  }, [open])

  const onPointerDown = (e: PointerEvent) => {
    drag.current = { startY: e.clientY, dy: 0 }
    e.currentTarget.setPointerCapture?.(e.pointerId)
  }
  const onPointerMove = (e: PointerEvent) => {
    if (!drag.current || !panelRef.current) return
    drag.current.dy = Math.max(0, e.clientY - drag.current.startY)
    panelRef.current.style.transform = `translateY(${drag.current.dy}px)`
  }
  const onPointerUp = () => {
    if (!drag.current || !panelRef.current) return
    const { dy } = drag.current
    drag.current = null
    panelRef.current.style.transform = ''
    if (dy > CLOSE_DISTANCE) onClose()
  }

  return (
    <dialog
      ref={ref}
      className={s.dialog}
      aria-labelledby={titleId}
      aria-describedby={description ? descId : undefined}
      onCancel={(e) => { e.preventDefault(); onClose() }}
      // Tocar no fundo escurecido fecha. Quem usa teclado fecha com Esc (onCancel acima).
      onClick={(e) => { if (e.target === ref.current) onClose() }}
    >
      <div ref={panelRef} className={s.panel}>
        <div className={s.handleZone} aria-hidden="true" onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerCancel={onPointerUp}>
          <div className={s.handle} />
        </div>
        <div>
          <h2 id={titleId} className={s.title}>{title}</h2>
          {description && <p id={descId} className={s.description}>{description}</p>}
        </div>
        {open && children}
      </div>
    </dialog>
  )
}
