import { useSearchParams } from 'react-router-dom'
import { Box, RowLink } from '@/components/Card'
import { EmptyState, Skeleton } from '@/components/Feedback'
import { Icon } from '@/components/Icon'
import { plural } from '@/domain/catalog'
import { useAsync } from '@/lib/useAsync'
import { countByCategory, listCategories, searchProducts } from '@/services/catalog'
import { PageHeader } from '../components/LojaShell'
import { ProductRow } from '../components/ProductCard'
import l from '../loja.module.css'

export function Buscar() {
  const [params, setParams] = useSearchParams()
  const q = params.get('q') ?? ''
  const term = q.trim()

  return (
    <div className={l.screen}>
      <PageHeader title="Buscar" />
      <main className={l.main} style={{ gap: 20 }}>
        <div role="search" className={`${l.searchBox} ${l.searchStrong}`}>
          <Icon name="buscar" size={20} />
          <input
            type="search"
            aria-label="Buscar produto"
            placeholder="Digite o nome do produto"
            className={l.searchInput}
            value={q}
            autoFocus={!!term}
            onChange={(e) => setParams(e.target.value ? { q: e.target.value } : {}, { replace: true })}
          />
        </div>
        {term ? <Results term={term} /> : <Categories />}
      </main>
    </div>
  )
}

function Categories() {
  const data = useAsync(() => Promise.all([listCategories(), countByCategory()]), [])
  return (
    <div className={l.stack}>
      <h2 className={l.h2}>Categorias</h2>
      <Box>
        {data.status === 'ready' ? (
          <>
            {data.data[0].map((c) => (
              <RowLink
                key={c.id}
                icon="estoque"
                title={c.name}
                sub={plural(data.data[1][c.id] ?? 0, 'produto', 'produtos')}
                to={`/categoria/${c.id}`}
              />
            ))}
            <RowLink icon="vender" title="Linha Bodeleve" sub="Produtos com a marca da casa" to="/linha" />
          </>
        ) : (
          <div role="status" aria-label="Carregando categorias" style={{ padding: '12px 0', display: 'grid', gap: 20 }}>
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} width="70%" />
            ))}
          </div>
        )}
      </Box>
      <p className={l.muted}>Experimente digitar “queijo” ou “farinha”.</p>
    </div>
  )
}

function Results({ term }: { term: string }) {
  const results = useAsync(() => searchProducts(term), [term])
  if (results.status !== 'ready') {
    return <div role="status" aria-label="Buscando" className={l.muted}>Buscando…</div>
  }
  if (results.data.length === 0) {
    return (
      <EmptyState icon="buscar" title={`Nada encontrado para “${term}”`} text="Confira a escrita ou procure por categoria." />
    )
  }
  return (
    <div className={l.stack}>
      <div aria-live="polite" className={l.muted}>
        {plural(results.data.length, 'resultado', 'resultados')}
      </div>
      <Box>
        {results.data.map((p) => (
          <ProductRow key={p.id} product={p} />
        ))}
      </Box>
    </div>
  )
}
