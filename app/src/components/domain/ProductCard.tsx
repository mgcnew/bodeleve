import { formatBRL } from '@/lib/format'
import { IconButton } from '../base/IconButton'
import { OriginBadge, type Origin } from '../base/OriginBadge'
import s from './ProductCard.module.css'

type ProductCardProps = {
  name: string
  /** "500 g", "1 kg"… */
  detail?: string
  priceCents: number
  origin?: Origin
  /** Sem foto própria, mostra o marcador [FOTO DO PRODUTO] (P-P). */
  imageSrc?: string
  onAdd?: () => void
}

export function ProductCard({ name, detail, priceCents, origin, imageSrc, onAdd }: ProductCardProps) {
  return (
    <article className={s.card}>
      {imageSrc ? (
        <div className={s.photo}><img src={imageSrc} alt={name} /></div>
      ) : (
        <div role="img" aria-label="Espaço para foto do produto" className={s.photo}>[FOTO DO PRODUTO]</div>
      )}
      <div className={s.badge}>{origin && <OriginBadge origin={origin} />}</div>
      <div>
        <div className={s.name}>{name}</div>
        {detail && <div className={s.detail}>{detail}</div>}
      </div>
      <div className={s.foot}>
        <div className={s.price}>{formatBRL(priceCents)}</div>
        <IconButton icon="adicionar" label={`Adicionar ${name} à sacola`} variant="primary" dense onClick={onAdd} />
      </div>
    </article>
  )
}
