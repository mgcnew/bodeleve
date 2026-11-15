import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { Button, Chip, EmptyState, IndicatorSkeleton } from '@/components'
import type { Product } from '@/domain/types'
import { useCategories, useProducts } from '@/ui/loja/queries'
import { ProductGrid } from '@/ui/loja/ProductGrid'
import { QueryBoundary, ScreenHeader } from '@/ui/loja/parts'
import s from '@/ui/loja/loja.module.css'

type OriginFilter = 'all' | Product['origin']
const filters: Array<{ value: OriginFilter; label: string }> = [
  { value: 'all', label: 'Todos' },
  { value: 'house', label: 'Feitos na casa' },
  { value: 'brand', label: 'Marca Bodeleve' },
]

export function CategoryPage() {
  const { id } = useParams()
  const [origin, setOrigin] = useState<OriginFilter>('all')
  const categories = useCategories()
  const products = useProducts({ categoryId: id })
  const name = categories.data?.find((c) => c.id === id)?.name
  const unknown = categories.isSuccess && !name

  return (
    <>
      <ScreenHeader title={name ?? ''} back="/buscar" bag />
      <main className={s.main}>
        {unknown ? (
          <EmptyState icon="buscar" title="Categoria não encontrada" description="Procure por outra categoria." action={<Button variant="secondary" onClick={() => history.back()}>Voltar</Button>} />
        ) : (
          <>
            <div role="group" aria-label="Filtrar por origem" className={s.chips}>
              {filters.map((f) => (
                <Chip key={f.value} selected={origin === f.value} onClick={() => setOrigin(f.value)}>
                  {f.label}
                </Chip>
              ))}
            </div>
            <QueryBoundary query={products} skeleton={<IndicatorSkeleton label="Carregando produtos" />} errorTitle="Não foi possível carregar os produtos">
              {(list) => {
                const shown = origin === 'all' ? list : list.filter((p) => p.origin === origin)
                return (
                  <>
                    <div aria-live="polite" className={s.sub}>{shown.length} {shown.length === 1 ? 'produto' : 'produtos'}</div>
                    {shown.length === 0 ? (
                      <EmptyState icon="estoque" title="Nenhum produto neste filtro" description="Mostre todos para ver o que há nesta categoria." action={<Button variant="secondary" onClick={() => setOrigin('all')}>Ver todos</Button>} />
                    ) : (
                      <ProductGrid products={shown} />
                    )}
                  </>
                )
              }}
            </QueryBoundary>
          </>
        )}
      </main>
    </>
  )
}
