import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { Icon } from '../Icon'
import s from './Toast.module.css'

type ToastInput = { message: string; actionLabel?: string; onAction?: () => void }
type ToastApi = { show: (t: ToastInput) => void }

const ToastContext = createContext<ToastApi | null>(null)

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast precisa estar dentro de <ToastProvider>')
  return ctx
}

/** Aviso temporário (um por vez). Com ação ("Desfazer") dura mais, para dar tempo de tocar. */
export function ToastProvider({ children, bottomOffset = 0 }: { children: ReactNode; bottomOffset?: number }) {
  const [toast, setToast] = useState<ToastInput | null>(null)
  const timer = useRef<number | undefined>(undefined)
  const show = useCallback((t: ToastInput) => {
    window.clearTimeout(timer.current)
    setToast(t)
    timer.current = window.setTimeout(() => setToast(null), t.actionLabel ? 8000 : 4000)
  }, [])
  useEffect(() => () => window.clearTimeout(timer.current), [])
  const api = useMemo(() => ({ show }), [show])
  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className={s.region} style={{ ['--toast-offset' as string]: `${bottomOffset}px` }}>
        <div role="status" aria-live="polite" style={{ width: '100%', maxWidth: 420 }}>
          {toast && <ToastView toast={toast} onDone={() => setToast(null)} />}
        </div>
      </div>
    </ToastContext.Provider>
  )
}

/** Apenas a aparência, para a galeria e para testes. */
export function ToastView({ toast, onDone }: { toast: ToastInput; onDone?: () => void }) {
  return (
    <div className={s.toast}>
      <Icon name="confirmar" size={20} />
      <span className={s.text}>{toast.message}</span>
      {toast.actionLabel && (
        <button type="button" className={s.action} onClick={() => { toast.onAction?.(); onDone?.() }}>{toast.actionLabel}</button>
      )}
    </div>
  )
}
