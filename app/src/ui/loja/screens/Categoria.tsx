import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { Button, ButtonLink } from '@/components/Button'
import { EmptyState, ErrorState } from '@/components/Feedback'
import { FilterChips } from '@/components/Field'
import { plural, type ProductOrigin } from '@/domain/catalog'
import { useAsync } from '@/lib/useAsync'
import { getCategory, listProducts } from '@/services/catalog'
import { TopBar } from '../components/LojaShell'
import { ProductGrid, ProductGridSkeleton } from '../components/ProductCard'
import l from '../loja.module.css'

type Filter = 'all' | Exclude<ProductOrigin, 'third_party'>

export function Categoria() {
  const { id = '' } = useParams()
  const [filter, setFilter] = useState<Filter>('all')
  const data = useAsync(() => Promise.all([getCategory(id), listProducts({ categoryId: id })]), [id])

  if (data.status === 'ready' && !data.data[0]) {
    return (
      <div className={l.screen}>
        <TopBar back="/buscar" />
        <EmptyState
          bare
          icon="buscar"
          title="Categoria não encontrada"
          text="Ela pode ter mudado de nome. Veja a lista completa."
          action={<ButtonLink to="/buscar">Ver categorias</ButtonLink>}
        />
      </div>
    )
  }

  const visible = data.status === 'ready' ? data.data[1].filter((p) => filter === 'all' || p.origin === filter) : []

  return (
    <div className={l.screen}>
      <TopBar title={data.status === 'ready' ? data.data[0]?.name : ''} back="/buscar" />
      <main className={`${l.main} ${l.mainTight}`}>
        <FilterChips
          label="Filtrar por origem"
          value={filter}
          onChange={setFilter}
          options={[
            { value: 'all', label: 'Todos' },
            { value: 'house_made', label: 'Feitos na casa' },
            { value: 'bodeleve_brand', label: 'Marca Bodeleve' },
          ]}
        />
        {data.status === 'loading' && <ProductGridSkeleton count={4} />}
        {data.status === 'error' && (
          <ErrorState
            title="Não foi possível carregar a categoria"
            text="Verifique a conexão e tente de novo."
            action={<Button onClick={data.retry}>Tentar de novo</Button>}
          />
        )}
        {data.status === 'ready' && (
          <>
            <div aria-live="polite" className={l.muted}>
              {plural(visible.length, 'produto', 'produtos')}
            </div>
            {visible.length > 0 ? (
              <ProductGrid products={visible} />
            ) : (
              <EmptyState
                icon="buscar"
                title="Nenhum produto com esse filtro"
                text="Volte para Todos para ver a categoria inteira."
                action={<Button variant="secondary" onClick={() => setFilter('all')}>Ver todos</Button>}
              />
            )}
          </>
        )}
      </main>
    </div>
  )
}
