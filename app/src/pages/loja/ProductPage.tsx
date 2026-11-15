import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Button, EmptyState, IndicatorSkeleton, OriginBadge, QuantityStepper } from '@/components'
import { formatBRL } from '@/lib/format'
import { useBag } from '@/store/bag'
import { useProduct } from '@/ui/loja/queries'
import { Footer, QueryBoundary, ScreenHeader } from '@/ui/loja/parts'
import { Photo } from '@/ui/loja/Photo'
import s from '@/ui/loja/loja.module.css'

export function ProductPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const add = useBag((b) => b.add)
  const [qty, setQty] = useState(1)
  const query = useProduct(id)

  return (
    <QueryBoundary query={query} skeleton={<><ScreenHeader back="/" bag /><main className={s.main}><IndicatorSkeleton label="Carregando produto" /></main></>} errorTitle="Não foi possível carregar o produto">
      {(product) =>
        !product ? (
          <>
            <ScreenHeader back="/" bag />
            <main className={s.main}>
              <EmptyState icon="buscar" title="Produto não encontrado" description="Ele pode ter saído da loja. Veja os outros produtos." action={<Button onClick={() => navigate('/buscar')}>Ver produtos</Button>} />
            </main>
          </>
        ) : (
          <>
            <ScreenHeader back="/" bag />
            <main className={s.main} style={{ gap: 20 }}>
              <Photo height={300} label="[FOTO DO PRODUTO]" ariaLabel="Espaço para foto do produto" />
              <div className={s.stack} style={{ gap: 8 }}>
                {product.origin !== 'resale' && <div><OriginBadge origin={product.origin} /></div>}
                <h1 className={s.h1} style={{ fontSize: 28, lineHeight: '34px' }}>{product.name}</h1>
                <div className={s.sub}>{product.unit}</div>
                <div className={`${s.tabular}`} style={{ font: 'var(--titulo-m)' }}>{formatBRL(product.priceCents)}</div>
              </div>
              {product.available && (
                <div className={`${s.card} ${s.spread}`}>
                  <span id="qtd-label" className={s.strong}>Quantidade</span>
                  <QuantityStepper label={`Quantidade de ${product.name}`} variant="compact" value={qty} min={1} onChange={setQty} />
                </div>
              )}
              <p className={s.sub} style={{ font: 'var(--corpo)', color: 'var(--texto)' }}>{product.details.description}</p>
              <dl className={s.linkList} style={{ margin: 0 }}>
                {[
                  ['Origem', product.origin === 'house' ? 'Feito na casa' : product.origin === 'brand' ? 'Marca Bodeleve' : 'Escolhido pela casa'],
                  ['Conservação', product.details.conservation],
                  ['Validade', product.details.validity],
                  ['Ingredientes', product.details.ingredients],
                ].map(([k, v]) => (
                  <div key={k} className={s.spread} style={{ padding: '14px 0', borderTop: k === 'Origem' ? 0 : '1px solid var(--linha)', alignItems: 'flex-start' }}>
                    <dt className={s.muted}>{k}</dt>
                    <dd style={{ margin: 0, textAlign: 'right', fontWeight: 600 }}>{v}</dd>
                  </div>
                ))}
              </dl>
            </main>
            <Footer>
              {product.available ? (
                <Button size="lg" fullWidth style={{ justifyContent: 'space-between' }} onClick={() => { add(product.id, qty); navigate('/sacola') }}>
                  <span>Adicionar à sacola</span>
                  <span className={s.tabular}>{formatBRL(product.priceCents * qty)}</span>
                </Button>
              ) : (
                <Button size="lg" fullWidth disabled>Indisponível hoje</Button>
              )}
            </Footer>
          </>
        )
      }
    </QueryBoundary>
  )
}
