import { Icon, type IconName } from '@/components/Icon'
import { plural } from '@/domain/catalog'
import { useAsync } from '@/lib/useAsync'
import { establishment } from '@/mocks/establishment'
import { listProducts } from '@/services/catalog'
import { CartBar, TopBar } from '../components/LojaShell'
import { ProductGrid, ProductGridSkeleton } from '../components/ProductCard'
import l from '../loja.module.css'
import s from './Institucional.module.css'

export function Linha() {
  const products = useAsync(() => listProducts({ origin: 'bodeleve_brand' }), [])
  const line = establishment.brandLine
  const facts: [IconName, string, string][] = [
    ['producao', 'Onde é produzida', line.madeBy],
    ['validade', 'Lote e validade', 'Cada produto traz lote e data na embalagem.'],
    ['confirmar', 'O que a marca garante', line.promise],
  ]

  return (
    <div className={l.screen}>
      <TopBar back="history" />
      <main className={l.main} style={{ paddingTop: 4 }}>
        <div className={s.hero}>
          <div className={l.eyebrow}>Marca da casa</div>
          <h1 className={s.heroTitle}>Linha Bodeleve</h1>
          <p>{line.text}</p>
        </div>

        <section className={l.stack12}>
          <div>
            <h2 className={l.h2}>Produtos da linha</h2>
            {products.status === 'ready' && (
              <div className={l.muted}>{plural(products.data.length, 'produto', 'produtos')}</div>
            )}
          </div>
          {products.status === 'ready' ? <ProductGrid products={products.data} /> : <ProductGridSkeleton count={2} />}
        </section>

        <section className={s.soon}>
          <h2 className={l.h2}>Em breve</h2>
          <p className={l.secondary}>{line.upcoming}</p>
        </section>

        <section className={l.stack12}>
          <h2 className={l.h2}>Como é feita</h2>
          {facts.map(([icon, title, text]) => (
            <div key={title} className={s.fact}>
              <Icon name={icon} size={22} />
              <div>
                <div style={{ fontWeight: 600 }}>{title}</div>
                <div className={l.muted}>{text}</div>
              </div>
            </div>
          ))}
        </section>
      </main>
      <div className={l.bottomStack}>
        <CartBar />
      </div>
    </div>
  )
}
