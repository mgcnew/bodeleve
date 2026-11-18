import { Skeleton } from './Feedback'
import styles from './ScreenSkeleton.module.css'

export type SkeletonKind = 'dashboard' | 'list' | 'detail'

/** Rótulo de acessibilidade: leitores de tela ouvem "Carregando" uma vez, os blocos ficam escondidos */
function Row() {
  return (
    <div className={styles.row}>
      <Skeleton width="40px" height={40} radius={10} />
      <div className={styles.rowText}>
        <Skeleton width="55%" height={16} />
        <Skeleton width="80%" height={12} />
      </div>
    </div>
  )
}

/** Esqueleto no formato da tela: faixa de topo, e então cartão, linhas e indicadores */
export function ScreenSkeleton({ kind, tabs }: { kind: SkeletonKind; tabs?: boolean }) {
  return (
    <div className={styles.screen} role="status" aria-label="Carregando">
      <div aria-hidden="true" className={styles.head}>
        <Skeleton width="52%" height={26} tone="dark" />
        {tabs && <Skeleton width="34%" height={14} tone="dark" />}
      </div>
      <div aria-hidden="true" className={styles.body}>
        {kind === 'dashboard' && (
          <>
            <Skeleton width="100%" height={150} radius={16} />
            <Skeleton width="38%" height={20} />
            <div className={styles.box}>
              <Row />
              <Row />
              <Row />
            </div>
            <div className={styles.kpis}>
              <Skeleton width="100%" height={86} radius={14} />
              <Skeleton width="100%" height={86} radius={14} />
              <Skeleton width="100%" height={86} radius={14} />
              <Skeleton width="100%" height={86} radius={14} />
            </div>
          </>
        )}
        {kind === 'list' && (
          <>
            <Skeleton width="100%" height={48} radius={999} />
            <div className={styles.box}>
              <Row />
              <Row />
              <Row />
              <Row />
              <Row />
            </div>
          </>
        )}
        {kind === 'detail' && (
          <>
            <Skeleton width="60%" height={28} />
            <Skeleton width="100%" height={110} radius={14} />
            <div className={styles.box}>
              <Row />
              <Row />
              <Row />
            </div>
          </>
        )}
      </div>
    </div>
  )
}
