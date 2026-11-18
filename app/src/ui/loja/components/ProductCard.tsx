import { Link } from 'react-router-dom'
import { IconButton } from '@/components/Button'
import { Seal } from '@/components/Badges'
import { Skeleton } from '@/components/Feedback'
import type { Product } from '@/domain/catalog'
import { formatCents } from '@/domain/money'
import { useCart } from '../state/cart'
import l from '../loja.module.css'
import s from './ProductCard.module.css'

/** Espaço para foto até haver material próprio (P-P) */
export function ProductPhoto({ className, white, label = '[FOTO DO PRODUTO]', origin }: { className?: string; white?: boolean; label?: string; origin?: Product['origin'] }) {
  return (
    <div
      role="img"
      aria-label={label === '[FOTO DA CASA]' ? 'Espaço para foto da casa' : 'Espaço para foto do produto'}
      className={`${l.photo} ${white ? l.photoWhite : ''} ${className ?? ''}`}
      data-origin={origin}
    >
      {label}
    </div>
  )
}

/** Na loja só aparecem os selos "Feito na casa" e "Marca Bodeleve" */
function LojaSeal({ product }: { product: Product }) {
  return product.origin === 'third_party' ? null : <Seal origin={product.origin} />
}

export function ProductCard({ product }: { product: Product }) {
  const { add } = useCart()
  return (
    <article className={s.card}>
      <Link to={`/produto/${product.id}`} className={s.link}>
        <ProductPhoto className={s.photo} origin={product.origin} />
        <div className={s.sealSlot}>
          <LojaSeal product={product} />
        </div>
        <div>
          <div className={s.name}>{product.name}</div>
          <div className={s.size}>{product.sizeLabel}</div>
        </div>
      </Link>
      <div className={s.foot}>
        <div className={s.price}>{formatCents(product.priceCents)}</div>
        {product.available ? (
          <IconButton
            icon="adicionar"
            label={`Adicionar ${product.name} à sacola`}
            tone="primary"
            onClick={() => add(product)}
          />
        ) : (
          <span className={s.unavailable}>Indisponível hoje</span>
        )}
      </div>
    </article>
  )
}

export function ProductCardSkeleton() {
  return (
    <div className={s.card} aria-hidden="true">
      <Skeleton width="100%" height={110} radius={10} />
      <Skeleton width="50%" height={18} radius={999} />
      <Skeleton width="80%" />
      <Skeleton width="40%" height={12} />
      <Skeleton width="45%" height={18} />
    </div>
  )
}

export function ProductGrid({ products }: { products: Product[] }) {
  return (
    <div className={l.grid}>
      {products.map((p) => (
        <ProductCard key={p.id} product={p} />
      ))}
    </div>
  )
}

export function ProductGridSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div role="status" aria-label="Carregando produtos" className={l.grid}>
      {Array.from({ length: count }, (_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  )
}

export function ProductRow({ product }: { product: Product }) {
  return (
    <Link to={`/produto/${product.id}`} className={s.row}>
      <span role="img" aria-label="Espaço para foto do produto" className={`${l.photo} ${s.rowPhoto}`} />
      <span className={s.rowText}>
        <span style={{ fontWeight: 600 }}>{product.name}</span>
        <span className={s.size}>{product.sizeLabel}</span>
      </span>
      <span className={s.price}>{formatCents(product.priceCents)}</span>
    </Link>
  )
}
