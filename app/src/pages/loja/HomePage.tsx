import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { AppLink, Icon, IndicatorSkeleton, SearchField } from '@/components'
import { useAllProducts, useHomeSections, useStoreContent } from '@/ui/loja/queries'
import { ProductGrid } from '@/ui/loja/ProductGrid'
import { BagLink, QueryBoundary, Section } from '@/ui/loja/parts'
import { Photo } from '@/ui/loja/Photo'
import s from '@/ui/loja/loja.module.css'

export function HomePage() {
  const navigate = useNavigate()
  const [q, setQ] = useState('')
  const sections = useHomeSections()
  const products = useAllProducts()
  const content = useStoreContent()
  const submit = (e: FormEvent) => {
    e.preventDefault()
    navigate(q.trim() ? `/buscar?q=${encodeURIComponent(q.trim())}` : '/buscar')
  }
  return (
    <>
      <div className={`${s.header} ${s.mobileOnly}`} style={{ padding: '16px 16px 8px', height: 'auto', justifyContent: 'space-between' }}>
        <div className={s.brand}>Bodeleve</div>
        <BagLink />
      </div>
      <main className={s.main} style={{ paddingTop: 8 }}>
        <form role="search" aria-label="Buscar na loja" className={s.mobileOnly} onSubmit={submit}>
          <SearchField label="Buscar na Bodeleve" value={q} onChange={(e) => setQ(e.target.value)} />
        </form>

        <div className={s.hero}>
          <div className={s.stack}>
            <div className={s.heroEyebrow}>Casa do Norte</div>
            <h1 className={s.heroTitle}>Sabores do Norte, feitos e escolhidos pela casa.</h1>
            <AppLink href="#casa" className={s.heroBtn}>Ver o que é feito aqui</AppLink>
          </div>
          <div className={s.deskOnly}><Photo height={260} /></div>
        </div>

        <nav aria-label="Atalhos" className={s.chips}>
          <AppLink href="#pedidos" className={s.chipLink}>Mais pedidos</AppLink>
          <AppLink href="#casa" className={s.chipLink}>Feitos na casa</AppLink>
          <AppLink href="#marca" className={s.chipLink}>Linha Bodeleve</AppLink>
        </nav>

        <QueryBoundary query={sections} errorTitle="Não foi possível carregar os produtos" skeleton={<IndicatorSkeleton label="Carregando produtos" />}>
          {(list) =>
            list.map((sec) => (
              <Section key={sec.id} id={sec.id} title={sec.title} subtitle={sec.subtitle}>
                <QueryBoundary query={products} skeleton={<IndicatorSkeleton label="Carregando produtos" />}>
                  {(all) => <ProductGrid products={sec.productIds.map((id) => all.find((p) => p.id === id)).filter((p): p is NonNullable<typeof p> => !!p)} />}
                </QueryBoundary>
              </Section>
            ))
          }
        </QueryBoundary>

        <AppLink href="/linha" className={s.link}>
          Conhecer a Linha Bodeleve <Icon name="avancar" size={18} />
        </AppLink>

        <section className={s.card} style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 8 }} aria-labelledby="sobre-t">
          <h2 id="sobre-t" className={s.h2}>Sobre a Bodeleve</h2>
          <div className={s.sub}>{content.data?.homeText}</div>
          <AppLink href="/sobre" className={s.link}>
            Conhecer a casa <Icon name="avancar" size={18} />
          </AppLink>
        </section>
      </main>
    </>
  )
}
