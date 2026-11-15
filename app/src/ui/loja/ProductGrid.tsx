import { ProductCard, useToast } from '@/components'
import type { Product } from '@/domain/types'
import { useBag } from '@/store/bag'
import s from './loja.module.css'

/** Grade de cartões de produto com "adicionar" em um toque e aviso com Desfazer. */
export function ProductGrid({ products }: { products: Product[] }) {
  const add = useBag((b) => b.add)
  const setQty = useBag((b) => b.setQty)
  const toast = useToast()
  return (
    <div className={s.grid}>
      {products.map((p) => (
        <ProductCard
          key={p.id}
          variant="store"
          name={p.name}
          detail={p.unit}
          priceCents={p.priceCents}
          origin={p.origin}
          href={`/produto/${p.id}`}
          unavailable={!p.available}
          onAdd={() => {
            add(p.id)
            toast.show({
              message: `${p.name} adicionado à sacola`,
              actionLabel: 'Desfazer',
              onAction: () => setQty(p.id, Math.max(0, (useBag.getState().items[p.id] ?? 1) - 1)),
            })
          }}
        />
      ))}
    </div>
  )
}
