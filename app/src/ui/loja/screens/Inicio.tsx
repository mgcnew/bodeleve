import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { EmptyState, ErrorState } from '@/components/Feedback'
import { Icon } from '@/components/Icon'
import { Button } from '@/components/Button'
import { chipClass } from '@/components/Field'
import type { Product } from '@/domain/catalog'
import { useAsync } from '@/lib/useAsync'
import { useEstablishment } from '../state/storeInfo'
import { listPopular, listProducts } from '@/services/catalog'
import { CartButton, mobileOnly } from '../components/LojaShell'
import { ProductGrid, ProductGridSkeleton } from '../components/ProductCard'
import l from '../loja.module.css'
import s from './Inicio.module.css'

// H-L3 — Início organizado em: Mais pedidos, Feitos na casa, Linha Bodeleve, Sobre a Bodeleve
async function loadHome() {
  const [popular, all] = await Promise.all([listPopular(), listProducts()])
  return {
    popular: popular.slice(0, 4),
    house: all.filter((p) => p.origin === 'house_made').slice(0, 4),
    brand: all.filter((p) => p.origin === 'bodeleve_brand').slice(0, 4),
  }
}

export function Inicio() {
  const establishment = useEstablishment()
  const home = useAsync(loadHome, [])
  const navigate = useNavigate()
  const [q, setQ] = useState('')

  const submit = (e: FormEvent) => {
    e.preventDefault()
    navigate(`/buscar?q=${encodeURIComponent(q)}`)
  }

  return (
    <div className={l.screen}>
      <header className={`${s.header} ${mobileOnly}`}>
        <div className={s.brand}>{establishment.name}</div>
        <CartButton outlined />
      </header>
      <main className={l.main}>
        <form role="search" onSubmit={submit} className={`${l.searchBox} ${s.search}`}>
          <Icon name="buscar" size={20} />
          <label htmlFor="busca" className="sr-only">
            Buscar produto
          </label>
          <input
            id="busca"
            type="search"
            placeholder="Buscar na Bodeleve"
            className={l.searchInput}
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </form>

        <div className={s.hero}>
          <div className={s.heroText}>
            <h1 className={s.heroTitle}>{establishment.heroTitle}</h1>
            <p className={s.heroSub}>{establishment.tagline}</p>
            <a href="#casa" className={s.heroCta}>
              Ver o que é feito aqui
            </a>
          </div>
          <div role="img" aria-label="Espaço para foto da casa" className={s.heroPhoto}>
            [FOTO DA CASA]
          </div>
        </div>

        <nav aria-label="Atalhos" className={s.rail}>
          <a href="#pedidos" className={`${chipClass} ${s.tintOrange}`}>
            Mais pedidos
          </a>
          <a href="#casa" className={`${chipClass} ${s.tintGreen}`}>
            Feitos na casa
          </a>
          <a href="#marca" className={`${chipClass} ${s.tintYellow}`}>
            Linha Bodeleve
          </a>
        </nav>

        {home.status === 'ready' && home.data.popular.length + home.data.house.length + home.data.brand.length === 0 ? (
          <EmptyState icon="sacola" title="O catálogo está sendo preparado" text="Volte em breve: os produtos da casa aparecem aqui assim que forem publicados." />
        ) : home.status === 'error' ? (
          <ErrorState
            title="Não foi possível carregar os produtos"
            text="Verifique a conexão e tente de novo."
            action={<Button onClick={home.retry}>Tentar de novo</Button>}
          />
        ) : (
          <>
            <Section id="pedidos" title="Mais pedidos" sub="O que mais sai no balcão." products={home.status === 'ready' ? home.data.popular : null} />
            <Section id="casa" title="Feitos na casa" sub="Produzidos aqui, em pequenos lotes." products={home.status === 'ready' ? home.data.house : null} />
            <Section id="marca" title="Linha Bodeleve" sub="Produtos com a marca da casa." products={home.status === 'ready' ? home.data.brand : null} />
            <Link to="/linha" className={l.linkArrow} style={{ marginTop: -12 }}>
              Conhecer a Linha Bodeleve
              <Icon name="avancar" size={18} />
            </Link>
          </>
        )}

        <section className={s.about}>
          <h2 className={l.h2Section}>Sobre a Bodeleve</h2>
          <p className={s.aboutText}>{establishment.aboutShort}</p>
          <Link to="/sobre" className={`${l.linkArrow} ${s.onDark}`}>
            Conhecer a casa
            <Icon name="avancar" size={18} />
          </Link>
        </section>
      </main>
    </div>
  )
}

function Section({ id, title, sub, products }: { id: string; title: string; sub: string; products: Product[] | null }) {
  return (
    <section id={id} className={s.section}>
      <div>
        <h2 className={l.h2Section}>{title}</h2>
        <p className={l.muted}>{sub}</p>
      </div>
      {products ? <ProductGrid products={products} /> : <ProductGridSkeleton count={2} />}
    </section>
  )
}
