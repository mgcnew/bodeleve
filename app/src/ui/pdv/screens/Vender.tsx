import { useEffect, useMemo, useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { Button, ButtonLink } from '@/components/Button'
import { EmptyState } from '@/components/Feedback'
import { FilterChips } from '@/components/Field'
import { Icon } from '@/components/Icon'
import { normalize } from '@/domain/catalog'
import { formatQty } from '@/domain/backoffice'
import { formatCents } from '@/domain/money'
import { cartTotal } from '@/domain/pdv'
import { categoriesStore } from '@/services/gestao/people'
import { addToCart, cartStore, cashStore, setLineGrams, setLineQty } from '@/services/pdv'
import { CashHeader } from '../PdvShell'
import { CartLineView, WeightSheet } from '../components/PdvBits'
import { useSellable, type Sellable } from '../components/useSellable'
import o from '@/styles/ops.module.css'
import s from './Pdv.module.css'

type Tab = 'fav' | 'cat' | 'search'

export function Vender() {
  const { session } = cashStore.useStore()
  const sellable = useSellable()
  const categories = categoriesStore.useStore()
  const cart = cartStore.useStore()
  const [tab, setTab] = useState<Tab>('fav')
  const [cat, setCat] = useState('queijos')
  const [q, setQ] = useState('')
  const [weighing, setWeighing] = useState<Sellable | null>(null)
  const [grams, setGrams] = useState(500)
  const [editing, setEditing] = useState<string | null>(null)
  const navigate = useNavigate()

  // teclado no balcão: "/" ou F2 busca o produto; F4 vai cobrar
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null
      const typing = !!t && (t.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(t.tagName))
      if (e.key === 'F2' || (e.key === '/' && !typing)) {
        e.preventDefault()
        setTab('search')
      } else if (e.key === 'F4' && cartStore.get().lines.length > 0) {
        e.preventDefault()
        navigate('/pdv/sacola')
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [navigate])

  const visible = useMemo(() => {
    if (tab === 'fav') return sellable.filter((x) => x.item.favoritePos)
    if (tab === 'cat') return sellable.filter((x) => x.item.categoryId === cat)
    return q.trim() ? sellable.filter((x) => normalize(x.item.name).includes(normalize(q.trim()))) : []
  }, [sellable, tab, cat, q])

  // sem caixa aberto, Vender leva à abertura de caixa
  if (!session || session.closedAt) return <Navigate to="/pdv/abertura" replace />

  const tap = (x: Sellable) => {
    if (x.item.soldByWeight) {
      setGrams(500)
      setEditing(null)
      setWeighing(x)
    } else addToCart({ itemId: x.item.id, name: x.item.name, grams: null, unitPriceCents: x.item.priceCents! })
  }

  const confirmWeight = () => {
    if (!weighing) return
    if (editing) setLineGrams(editing, grams)
    else addToCart({ itemId: weighing.item.id, name: weighing.item.name, grams, quantity: 1, unitPriceCents: weighing.item.priceCents! })
    setWeighing(null)
  }

  const editWeight = (itemId: string) => {
    const x = sellable.find((s) => s.item.id === itemId)
    const l = cart.lines.find((c) => c.itemId === itemId)
    if (!x || !l) return
    setGrams(l.grams ?? 500)
    setEditing(itemId)
    setWeighing(x)
  }

  return (
    <div className={o.screen}>
      <CashHeader />
      <div role="tablist" className={s.tabs}>
        {(
          [
            ['fav', 'Favoritos'],
            ['cat', 'Categorias'],
            ['search', 'Buscar'],
          ] as const
        ).map(([k, label]) => (
          <button key={k} type="button" role="tab" aria-selected={tab === k} className={s.tab} onClick={() => setTab(k)}>
            {label}
          </button>
        ))}
      </div>
      <div className={s.split}>
        <main style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: 12, minWidth: 0 }}>
          {tab === 'cat' && (
            <FilterChips label="Categoria" value={cat} onChange={setCat} options={categories.filter((c) => !['temperos', 'bebidas'].includes(c.id)).map((c) => ({ value: c.id, label: c.name }))} />
          )}
          {tab === 'search' && (
            <div role="search" style={{ display: 'flex', alignItems: 'center', gap: 10, height: 48, padding: '0 16px', borderRadius: 999, background: 'var(--superficie)', border: '1px solid var(--cor-primaria)', boxShadow: '0 0 0 3px var(--cor-primaria-suave)' }}>
              <Icon name="buscar" size={20} />
              <input autoFocus type="search" aria-label="Buscar produto" placeholder="Nome do produto" value={q} onChange={(e) => setQ(e.target.value)} style={{ flex: '1 1 0', minWidth: 0, border: 0, background: 'transparent', font: 'var(--corpo)', outline: 'none' }} />
            </div>
          )}
          {visible.length > 0 ? (
            <div className={s.tiles}>
              {visible.map((x) => (
                <button
                  key={x.item.id}
                  type="button"
                  className={s.tile}
                  aria-label={`${x.item.name}, ${formatCents(x.item.priceCents!)}${x.item.soldByWeight ? ' por quilo' : ''}, estoque ${formatQty(x.available, x.item.unit)}`}
                  onClick={() => tap(x)}
                >
                  <span className={s.tileName}>{x.item.name}</span>
                  <span className={s.tileFoot}>
                    <b>
                      {formatCents(x.item.priceCents!)}
                      {x.item.soldByWeight ? '/kg' : ''}
                    </b>
                    <span className={`${s.stock} ${x.low ? s.stockLow : ''}`}>{x.low && 'Baixo · '}{formatQty(x.available, x.item.unit)}</span>
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <EmptyState icon="buscar" title={tab === 'search' && !q.trim() ? 'Digite o nome do produto' : 'Nenhum produto aqui'} text={tab === 'fav' ? 'Marque produtos como favoritos no cadastro.' : undefined} />
          )}
          <p className={o.muted}>Toque para somar 1. Produtos por peso pedem o peso antes.</p>
          <p className={`${o.muted} ${s.keysHelp}`}>
            Teclado: <kbd>/</kbd> busca · <kbd>F4</kbd> cobra
          </p>
        </main>

        <aside className={s.aside} aria-label="Sacola">
          <h2 className={o.h2}>Sacola</h2>
          {cart.lines.length === 0 ? (
            <p className={o.muted}>Toque num produto para começar a venda.</p>
          ) : (
            <>
              <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8 }}>
                {cart.lines.map((l) => (
                  <CartLineView key={l.itemId} line={l} onQty={(n) => setLineQty(l.itemId, n)} onWeight={() => editWeight(l.itemId)} />
                ))}
              </ul>
              <div className={o.sumTotal}>
                <span>Total</span>
                <span>{formatCents(cartTotal(cart))}</span>
              </div>
              <ButtonLink to="/pdv/sacola" size="l" block>
                Revisar e cobrar
              </ButtonLink>
              <Button variant="secondary" block onClick={() => cartStore.reset()}>
                Limpar sacola
              </Button>
            </>
          )}
        </aside>
      </div>

      <WeightSheet
        open={!!weighing}
        name={weighing?.item.name ?? ''}
        unitPriceCents={weighing?.item.priceCents ?? 0}
        grams={grams}
        onGrams={setGrams}
        onConfirm={confirmWeight}
        onClose={() => setWeighing(null)}
        confirmLabel={editing ? 'Atualizar' : 'Adicionar'}
      />
      <Link to="/pdv/sacola" className="sr-only">
        Ir para a sacola
      </Link>
    </div>
  )
}
