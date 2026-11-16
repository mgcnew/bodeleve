import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Seal } from '@/components/Badges'
import { Button, ButtonLink } from '@/components/Button'
import { Banner, EmptyState, ErrorState, Skeleton } from '@/components/Feedback'
import { QuantityStepper } from '@/components/QuantityStepper'
import { originName } from '@/domain/catalog'
import { formatCents } from '@/domain/money'
import { useAsync } from '@/lib/useAsync'
import { getProduct } from '@/services/catalog'
import { TopBar } from '../components/LojaShell'
import { ProductPhoto } from '../components/ProductCard'
import { useCart } from '../state/cart'
import l from '../loja.module.css'
import s from './Produto.module.css'

export function Produto() {
  const { id = '' } = useParams()
  const product = useAsync(() => getProduct(id), [id])
  const { add } = useCart()
  const navigate = useNavigate()
  const [qty, setQty] = useState(1)

  if (product.status === 'loading') {
    return (
      <div className={`${l.screen} ${l.narrow}`}>
        <TopBar back="history" />
        <main role="status" aria-label="Carregando produto" className={`${l.main} ${l.mainForm}`}>
          <Skeleton width="100%" height={300} radius={20} />
          <Skeleton width="30%" height={20} radius={999} />
          <Skeleton width="60%" height={28} />
          <Skeleton width="25%" height={22} />
        </main>
      </div>
    )
  }

  if (product.status === 'error') {
    return (
      <div className={`${l.screen} ${l.narrow}`}>
        <TopBar back="history" />
        <main className={l.main}>
          <ErrorState
            title="Não foi possível carregar o produto"
            text="Verifique a conexão e tente de novo."
            action={<Button onClick={product.retry}>Tentar de novo</Button>}
          />
        </main>
      </div>
    )
  }

  const p = product.data
  if (!p) {
    return (
      <div className={`${l.screen} ${l.narrow}`}>
        <TopBar back="history" />
        <EmptyState
          bare
          icon="buscar"
          title="Produto não encontrado"
          text="Ele pode ter saído do catálogo. Procure por outro nome ou categoria."
          action={<ButtonLink to="/buscar">Buscar produtos</ButtonLink>}
        />
      </div>
    )
  }

  const addToCart = () => {
    add(p, qty)
    navigate('/sacola')
  }

  return (
    <div className={l.screen}>
      <TopBar back="history" />
      <main className={`${l.main} ${l.mainForm} ${s.layout}`}>
        <ProductPhoto className={s.photo} />
        <div className={l.main} style={{ padding: 0, gap: 20 }}>
          <div className={l.stack}>
            {p.origin !== 'third_party' && (
              <div>
                <Seal origin={p.origin} />
              </div>
            )}
            <h1 className={s.title}>{p.name}</h1>
            <div className={l.muted}>{p.sizeLabel}</div>
            <div className={s.price}>{formatCents(p.priceCents)}</div>
          </div>

          {p.available ? (
            <div className={s.qty}>
              <span id="qtd-rotulo" style={{ fontWeight: 600 }}>
                Quantidade
              </span>
              <QuantityStepper value={qty} onChange={setQty} min={1} labelledBy="qtd-rotulo" large />
            </div>
          ) : (
            <Banner tone="warning">Indisponível hoje. Volte amanhã ou fale com a loja.</Banner>
          )}

          <p className={l.secondary}>{p.description}</p>
          <dl className={s.info} style={{ margin: 0 }}>
            <Info term="Origem" value={originName(p.origin)} />
            <Info term="Conservação" value={p.storage} />
            <Info term="Validade" value={p.shelfLife} />
            <Info term="Ingredientes" value={p.ingredients} />
          </dl>
        </div>
      </main>
      {p.available && (
        <div className={l.footer}>
          <Button size="l" block spread onClick={addToCart}>
            <span>Adicionar à sacola</span>
            <span className={l.num}>{formatCents(qty * p.priceCents)}</span>
          </Button>
        </div>
      )}
    </div>
  )
}

function Info({ term, value }: { term: string; value: string }) {
  return (
    <div className={s.infoRow}>
      <dt>{term}</dt>
      <dd>{value}</dd>
    </div>
  )
}
