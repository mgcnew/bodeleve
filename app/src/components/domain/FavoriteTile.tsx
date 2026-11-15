import { cx } from '@/lib/cx'
import s from './FavoriteTile.module.css'

type FavoriteTileProps = {
  name: string
  /** "32,90" ou "59,90/kg" */
  price: string
  /** "18 un", "6,4 kg" */
  stock: string
  lowStock?: boolean
  selected?: boolean
  onClick?: () => void
}

/** Bloco de favorito do PDV: um toque por item. Estoque baixo muda cor e peso do número (e é lido como "estoque baixo" por leitor de tela). */
export function FavoriteTile({ name, price, stock, lowStock, selected, onClick }: FavoriteTileProps) {
  return (
    <button type="button" aria-pressed={selected} className={cx(s.tile, selected && s.selected)} onClick={onClick}>
      <span className={s.name}>{name}</span>
      <span className={s.foot}>
        <span className={s.price}>{price}</span>
        <span className={cx(s.stock, lowStock && s.low)}>
          {stock}
          {lowStock && <span className="sr-only"> (estoque baixo)</span>}
        </span>
      </span>
    </button>
  )
}
