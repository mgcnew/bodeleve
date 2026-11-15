import s from './loja.module.css'

/** Marcador de foto até haver material próprio (P-P, P3). */
export function Photo({ label = '[FOTO DA CASA]', ariaLabel = 'Espaço para foto da casa', height }: { label?: string; ariaLabel?: string; height: number }) {
  return (
    <div role="img" aria-label={ariaLabel} className={s.photoHouse} style={{ height }}>
      {label}
    </div>
  )
}
