import s from './Skeleton.module.css'

type BlockProps = { width: number | string; height: number; className?: string }

/** Bloco cinza no lugar do conteúdo. */
export function SkeletonBlock({ width, height }: BlockProps) {
  return <div className={s.block} style={{ width, height }} aria-hidden="true" />
}

/** Esqueleto de lista no formato do conteúdo (foto, duas linhas e valor). Mantém o lugar para a tela não pular. */
export function ListSkeleton({ rows = 4, label = 'Carregando lista' }: { rows?: number; label?: string }) {
  return (
    <div role="status" aria-label={label} className={s.list}>
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className={s.row}>
          <div className={s.thumb} />
          <div className={s.lines}>
            <SkeletonBlock width="70%" height={14} />
            <SkeletonBlock width="40%" height={12} />
          </div>
          <SkeletonBlock width={56} height={16} />
        </div>
      ))}
    </div>
  )
}

export function IndicatorSkeleton({ label = 'Carregando indicador' }: { label?: string }) {
  return (
    <div role="status" aria-label={label} className={s.indicator}>
      <SkeletonBlock width="60%" height={12} />
      <SkeletonBlock width="80%" height={22} />
      <SkeletonBlock width="50%" height={10} />
    </div>
  )
}
