import { useSearchParams } from 'react-router-dom'
import { AppLink, Button, EmptyState, Icon, ListSkeleton, SearchField } from '@/components'
import { formatBRL } from '@/lib/format'
import { useAllProducts, useCategories, useProducts } from '@/ui/loja/queries'
import { LinkList, QueryBoundary, Section, TabTitle } from '@/ui/loja/parts'
import s from '@/ui/loja/loja.module.css'

export function SearchPage() {
  const [params, setParams] = useSearchParams()
  const q = params.get('q') ?? ''
  const term = q.trim()
  const categories = useCategories()
  const all = useAllProducts()
  const results = useProducts({ query: term })
  const setQ = (value: string) => setParams(value ? { q: value } : {}, { replace: true })

  return (
    <>
      <TabTitle>Buscar</TabTitle>
      <main className={s.main} style={{ paddingTop: 8 }}>
        <SearchField label="Buscar produto" placeholder="Digite o nome do produto" value={q} onChange={(e) => setQ(e.target.value)} />

        {term === '' ? (
          <Section title="Categorias">
            <QueryBoundary query={categories} skeleton={<ListSkeleton rows={4} label="Carregando categorias" />}>
              {(cats) => (
                <LinkList
                  rows={[
                    ...cats.map((c) => {
                      const n = all.data?.filter((p) => p.categoryId === c.id).length
                      return { href: `/categoria/${c.id}`, icon: 'estoque' as const, title: c.name, detail: n == null ? undefined : `${n} ${n === 1 ? 'produto' : 'produtos'}` }
                    }),
                    { href: '/linha', icon: 'vender' as const, title: 'Linha Bodeleve', detail: 'Produtos com a marca da casa' },
                  ]}
                />
              )}
            </QueryBoundary>
            <div className={s.sub}>Experimente digitar “queijo” ou “farinha”.</div>
          </Section>
        ) : (
          <QueryBoundary query={results} skeleton={<ListSkeleton rows={3} label="Carregando resultados" />} errorTitle="Não foi possível buscar">
            {(list) =>
              list.length === 0 ? (
                <EmptyState icon="buscar" title={`Nada encontrado para “${term}”`} description="Confira a escrita ou procure por categoria." action={<Button variant="secondary" onClick={() => setQ('')}>Ver categorias</Button>} />
              ) : (
                <div className={s.section}>
                  <div aria-live="polite" className={s.sub}>{list.length} {list.length === 1 ? 'resultado' : 'resultados'}</div>
                  <div className={s.linkList}>
                    {list.map((p) => (
                      <AppLink key={p.id} href={`/produto/${p.id}`} className={s.linkRow} style={{ minHeight: 64 }}>
                        <span className={s.thumb} aria-hidden="true" />
                        <span className={s.grow}>
                          <span className={s.optionTitle}>{p.name}</span>
                          <span className={s.optionDetail}>{p.unit}</span>
                        </span>
                        <span className={s.price}>{formatBRL(p.priceCents)}</span>
                        <Icon name="avancar" size={18} />
                      </AppLink>
                    ))}
                  </div>
                </div>
              )
            }
          </QueryBoundary>
        )}
      </main>
    </>
  )
}
