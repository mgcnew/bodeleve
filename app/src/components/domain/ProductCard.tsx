import { cx } from '@/lib/cx'
import { formatBRL } from '@/lib/format'
import { AppLink } from '../AppLink'
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
  /** Se informado, foto e nome levam à página do produto. */
  href?: string
  /** `store` = proporções das telas da loja (foto de 110 px, preço de 17 px); `default` = quadro do design system. */
  variant?: 'default' | 'store'
  /** Sem estoque: some o botão de adicionar e aparece o aviso. */
  unavailable?: boolean
}

export function ProductCard({ name, detail, priceCents, origin, imageSrc, onAdd, href, variant = 'default', unavailable }: ProductCardProps) {
  const top = (
    <>
      {imageSrc ? (
        <div className={s.photo}><img src={imageSrc} alt={name} /></div>
      ) : (
        <div role="img" aria-label="Espaço para foto do produto" className={s.photo}>[FOTO DO PRODUTO]</div>
      )}
      <div className={s.badge}>{origin && origin !== 'resale' && <OriginBadge origin={origin} />}</div>
      <div>
        <div className={s.name}>{name}</div>
        {detail && <div className={s.detail}>{detail}</div>}
      </div>
    </>
  )
  return (
    <article className={cx(s.card, variant === 'store' && s.store)}>
      {href ? <AppLink href={href} className={s.link}>{top}</AppLink> : <div className={s.link}>{top}</div>}
      <div className={s.foot}>
        <div className={s.price}>{formatBRL(priceCents)}</div>
        {unavailable ? (
          <span className={s.unavailable}>Indisponível</span>
        ) : (
          <IconButton icon="adicionar" label={`Adicionar ${name} à sacola`} variant="primary" dense onClick={onAdd} />
        )}
      </div>
    </article>
  )
}
