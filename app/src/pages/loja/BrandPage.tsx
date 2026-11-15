import { Icon, IndicatorSkeleton, type IconName } from '@/components'
import { useProducts, useStoreContent } from '@/ui/loja/queries'
import { ProductGrid } from '@/ui/loja/ProductGrid'
import { QueryBoundary, ScreenHeader, Section } from '@/ui/loja/parts'
import s from '@/ui/loja/loja.module.css'

export function BrandPage() {
  const products = useProducts({ origin: 'brand' })
  const content = useStoreContent()
  const rows: Array<{ icon: IconName; title: string; text?: string }> = [
    { icon: 'producao', title: 'Onde é produzida', text: content.data?.brandWhere },
    { icon: 'validade', title: 'Lote e validade', text: 'Cada produto traz lote e data na embalagem.' },
    { icon: 'confirmar', title: 'O que a marca garante', text: content.data?.brandCommitment },
  ]
  return (
    <>
      <ScreenHeader back="/" bag />
      <main className={s.main} style={{ gap: 24 }}>
        <div className={s.hero} style={{ padding: '28px 20px' }}>
          <div className={s.stack}>
            <div className={s.heroEyebrow}>Marca da casa</div>
            <h1 className={s.heroTitle}>Linha Bodeleve</h1>
            <div style={{ font: 'var(--corpo)' }}>{content.data?.brandText}</div>
          </div>
        </div>

        <QueryBoundary query={products} skeleton={<IndicatorSkeleton label="Carregando produtos" />} errorTitle="Não foi possível carregar a linha">
          {(list) => (
            <Section title="Produtos da linha" subtitle={`${list.length} ${list.length === 1 ? 'produto' : 'produtos'}`}>
              <ProductGrid products={list} />
            </Section>
          )}
        </QueryBoundary>

        <section className={s.card} style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 6 }} aria-labelledby="breve-t">
          <h2 id="breve-t" className={s.h2}>Em breve</h2>
          <div className={s.sub}>{content.data?.brandUpcoming}</div>
        </section>

        <Section title="Como é feita">
          {rows.map((r) => (
            <div key={r.title} className={`${s.card} ${s.cardRow}`}>
              <Icon name={r.icon} size={22} />
              <div>
                <div className={s.strong}>{r.title}</div>
                <div className={s.sub}>{r.text}</div>
              </div>
            </div>
          ))}
        </Section>
      </main>
    </>
  )
}
