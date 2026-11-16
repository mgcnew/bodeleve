import { useId, useState, type FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { AppLink, Banner, Button, ButtonLink, Chip, EmptyState, Icon, IndicatorSkeleton, ListSkeleton, OriginBadge, SearchField, StatusTag, Switch, TextField, ChoiceOption } from '@/components'
import { kindFilters, kindLabel, marginLabel, splitNewLabel, validateProduct, type ProductInput, type ProductKind } from '@/domain/catalog'
import type { ItemType } from '@/domain/inventory'
import { unitKg } from '@/domain/units'
import { formatBRL, parseMoney } from '@/lib/format'
import { useServices } from '@/services'
import type { ProductDetail, ProductRow } from '@/services/types'
import { useCategoryRows, useInvalidateCatalog, useProduct, useProducts } from '@/ui/gestao/queries'
import { Footer, QueryBoundary, ScreenHeader } from '@/ui/loja/parts'
import s from '@/ui/gestao/gestao.module.css'
import l from '@/ui/loja/loja.module.css'

const norm = (t: string) => t.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
const fieldStyle = { width: '100%', padding: '10px 12px', borderRadius: 8, border: '1.5px solid var(--linha)', background: 'var(--superficie)', font: 'var(--corpo)', color: 'var(--texto)' } as const

function KindTag({ kind }: { kind: ProductKind }) {
  if (kind === 'casa') return <OriginBadge origin="house" />
  if (kind === 'marca') return <OriginBadge origin="brand" />
  if (kind === 'rev') return <OriginBadge origin="resale" />
  return <StatusTag>{kindLabel.mp}</StatusTag>
}

const priceText = (r: ProductRow) => (r.priceCents == null ? '—' : r.soldByWeight ? `${formatBRL(r.priceCents)} / kg` : formatBRL(r.priceCents))

export function ProductsPage() {
  const query = useProducts()
  const [q, setQ] = useState('')
  const [kind, setKind] = useState<ProductKind | 'all'>('all')
  return (
    <>
      <ScreenHeader title="Produtos" back="/gestao/mais" />
      <main className={s.main} style={{ gap: 16, paddingTop: 16 }}>
        <SearchField label="Buscar produto" placeholder="Buscar produto" value={q} onChange={(e) => setQ(e.target.value)} />
        <div role="group" aria-label="Tipo de produto" className={s.filters}>
          {kindFilters.map((f) => (
            <Chip key={f.key} selected={kind === f.key} onClick={() => setKind(f.key)}>{f.label}</Chip>
          ))}
        </div>
        <QueryBoundary query={query} skeleton={<ListSkeleton rows={5} label="Carregando produtos" />} errorTitle="Não foi possível carregar os produtos">
          {(rows) => {
            const shown = rows.filter((r) => (kind === 'all' || r.kind === kind) && (!q.trim() || norm(r.label).includes(norm(q))))
            return (
              <>
                {shown.length === 0 ? (
                  <EmptyState icon="buscar" title="Nenhum produto encontrado" description="Mude o filtro ou confira a escrita." />
                ) : (
                  <div className={l.linkList}>
                    {shown.map((r) => (
                      <AppLink key={r.id} href={`/gestao/produtos/${r.id}`} className={l.linkRow} style={{ minHeight: 72 }}>
                        <span className={s.disc} aria-hidden="true">{r.label.charAt(0)}</span>
                        <span className={l.grow}>
                          <span className={l.optionTitle}>{r.label}</span>
                          <span style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
                            <KindTag kind={r.kind} />
                            <span className={l.optionDetail}>{r.channel}</span>
                          </span>
                        </span>
                        <span style={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{priceText(r)}</span>
                        <Icon name="avancar" size={18} />
                      </AppLink>
                    ))}
                  </div>
                )}
                <div className={s.filters}>
                  <ButtonLink href="/gestao/produtos/novo">Novo produto</ButtonLink>
                  <ButtonLink href="/gestao/produtos/categorias" variant="secondary">Categorias</ButtonLink>
                  <ButtonLink href="/gestao/producao/fichas" variant="secondary">Fichas técnicas</ButtonLink>
                </div>
                <div className={l.sub}>{rows.length} itens cadastrados.</div>
              </>
            )
          }}
        </QueryBoundary>
      </main>
    </>
  )
}

const toInput = (d: ProductDetail): ProductInput => ({
  name: d.name, categoryId: d.categoryId, itemType: d.itemType, origin: d.origin, priceCents: d.priceCents, weightPriceCents: d.weightPriceCents, minStock: d.minStock,
  published: d.published, favoritePos: d.favoritePos, soldByWeight: d.soldByWeight, tracksExpiry: d.tracksExpiry, description: d.description,
  lastCostCents: d.costSource === 'last_purchase' ? d.costCents : null,
})

function SwitchRow({ label, hint, checked, onChange }: { label: string; hint: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div>
      <Switch label={label} checked={checked} onChange={onChange} />
      <div className={l.sub} style={{ marginTop: -4 }}>{hint}</div>
    </div>
  )
}

function ProductForm({ detail, isNew = false }: { detail: ProductDetail; isNew?: boolean }) {
  const { admin } = useServices()
  const navigate = useNavigate()
  const invalidate = useInvalidateCatalog()
  const [form, setForm] = useState<ProductInput>(() => toInput(detail))
  const [priceText, setPriceText] = useState(() => (detail.priceCents == null ? '' : (detail.priceCents / 100).toFixed(2).replace('.', ',')))
  const [costText, setCostText] = useState(() => (detail.costSource === 'last_purchase' && detail.costCents != null ? (detail.costCents / 100).toFixed(2).replace('.', ',') : ''))
  const [costError, setCostError] = useState<string | undefined>()
  const [weightText, setWeightText] = useState(() => (detail.weightPriceCents == null ? '' : (detail.weightPriceCents / 100).toFixed(2).replace('.', ',')))
  const [errors, setErrors] = useState<ReturnType<typeof validateProduct>>({})
  const [saved, setSaved] = useState(false)
  const [failed, setFailed] = useState(false)
  const [busy, setBusy] = useState(false)
  const catId = useId()
  const descId = useId()
  const set = <K extends keyof ProductInput>(k: K, v: ProductInput[K]) => { setForm((f) => ({ ...f, [k]: v })); setSaved(false) }
  const raw = form.itemType === 'raw_material'
  // Produto novo: a medida no fim do nome ("Queijo coalho 500 g") é a embalagem.
  const canWeigh = unitKg(isNew ? splitNewLabel(form.name).unit : detail.unit) != null

  const setType = (t: ItemType) => setForm((f) => ({ ...f, itemType: t, origin: t === 'raw_material' ? null : f.origin ?? (t === 'finished' ? 'house' : 'resale') }))

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    const withCost = form.itemType !== 'finished'
    const cost = costText.trim() === '' ? null : parseMoney(costText)
    const input = { ...form, priceCents: raw ? null : parseMoney(priceText), weightPriceCents: raw || !form.soldByWeight ? null : parseMoney(weightText), ...(withCost ? { lastCostCents: cost } : {}) }
    const errs = validateProduct(input)
    setCostError(withCost && costText.trim() !== '' && cost == null ? 'Informe o custo, por exemplo 18,50.' : undefined)
    setErrors(errs)
    if (withCost && costText.trim() !== '' && cost == null) return
    setSaved(false)
    setFailed(false)
    if (Object.keys(errs).length) return
    setBusy(true)
    try {
      if (isNew) {
        const created = await admin.catalog.create(input)
        await invalidate()
        navigate(`/gestao/produtos/${created.id}`, { replace: true })
        return
      }
      await admin.catalog.save(detail.id, input)
      await invalidate()
      setSaved(true)
    } catch {
      setFailed(true)
    }
    setBusy(false)
  }

  const price = raw ? null : parseMoney(priceText)
  return (
    <form onSubmit={submit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div className={l.sub} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 120, borderRadius: 12, border: '1.5px dashed var(--linha)' }}>[FOTO DO PRODUTO]</div>
      <TextField label="Nome" value={form.name} onChange={(e) => set('name', e.target.value)} error={errors.name} hint={isNew ? 'Escreva a medida no fim, por exemplo Queijo coalho 500 g.' : undefined} />
      <div className={l.stack} style={{ gap: 6 }}>
        <label htmlFor={catId} style={{ fontWeight: 600 }}>Categoria</label>
        <select id={catId} value={form.categoryId} onChange={(e) => set('categoryId', e.target.value)} style={{ ...fieldStyle, height: 48 }}>
          {(detail.categories.length === 0 || form.categoryId === '') && <option value="">Sem categoria</option>}
          {detail.categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>
      <fieldset className={l.fieldset}>
        <legend style={{ fontWeight: 600 }}>Tipo de item</legend>
        <ChoiceOption type="radio" name="tipo" checked={form.itemType === 'finished'} onChange={() => setType('finished')}><b>Produto acabado</b><br /><span className={l.sub}>Produzido a partir de uma ficha técnica</span></ChoiceOption>
        <ChoiceOption type="radio" name="tipo" checked={form.itemType === 'resale'} onChange={() => setType('resale')}><b>Revenda</b><br /><span className={l.sub}>Comprado pronto de fornecedor</span></ChoiceOption>
        <ChoiceOption type="radio" name="tipo" checked={raw} onChange={() => setType('raw_material')}><b>Matéria-prima</b><br /><span className={l.sub}>Usado na produção, não é vendido</span></ChoiceOption>
      </fieldset>
      {!raw && (
        <fieldset className={l.fieldset}>
          <legend style={{ fontWeight: 600 }}>Origem na loja</legend>
          <ChoiceOption type="radio" name="origem" checked={form.origin === 'house'} onChange={() => set('origin', 'house')}><b>Feito na casa</b></ChoiceOption>
          <ChoiceOption type="radio" name="origem" checked={form.origin === 'brand'} onChange={() => set('origin', 'brand')}><b>Marca Bodeleve</b><br /><span className={l.sub}>Feito na casa ou por parceiro, com a marca</span></ChoiceOption>
          <ChoiceOption type="radio" name="origem" checked={form.origin === 'resale' || form.origin === null} onChange={() => set('origin', 'resale')}><b>Terceiros</b><br /><span className={l.sub}>Sem selo na loja</span></ChoiceOption>
        </fieldset>
      )}
      {!raw && <TextField label="Preço de venda" inputMode="decimal" value={priceText} onChange={(e) => { setPriceText(e.target.value); setSaved(false) }} error={errors.price} hint={form.soldByWeight ? 'Preço da embalagem, na loja online.' : undefined} />}
      {form.itemType !== 'finished' && <TextField label="Custo da última compra (R$)" inputMode="decimal" value={costText} onChange={(e) => { setCostText(e.target.value); setSaved(false) }} error={costError} hint="Opcional. Vale até o primeiro recebimento de compra, que atualiza o custo sozinho." />}
      <TextField label="Estoque mínimo" inputMode="numeric" value={form.minStock} onChange={(e) => set('minStock', e.target.value)} error={errors.minStock} />
      {!raw && (
        <div className={s.todayGrid}>
          <div className={l.sub}>{detail.costSource === 'recipe' ? 'Custo (da ficha técnica)' : 'Custo (último recebimento)'}<div style={{ font: 'var(--corpo)', fontWeight: 600, color: 'var(--texto)' }}>{detail.costCents == null ? '—' : formatBRL(detail.costCents)}</div></div>
          <div className={l.sub}>Margem<div style={{ font: 'var(--corpo)', fontWeight: 600, color: 'var(--texto)' }}>{marginLabel(price, detail.costCents)}</div></div>
        </div>
      )}
      {!raw && <SwitchRow label="Publicar na loja online" hint="Aparece no catálogo para clientes" checked={form.published} onChange={(v) => set('published', v)} />}
      {!raw && <SwitchRow label="Favorito no PDV" hint="Fica na primeira tela do balcão" checked={form.favoritePos} onChange={(v) => set('favoritePos', v)} />}
      {!raw && <SwitchRow label="Vendido por peso" hint={canWeigh ? 'Pede o peso na hora da venda' : 'Disponível só para produtos com medida em g ou kg'} checked={form.soldByWeight && canWeigh} onChange={(v) => canWeigh && set('soldByWeight', v)} />}
      {!raw && form.soldByWeight && canWeigh && <TextField label="Preço por kg (balcão)" inputMode="decimal" value={weightText} onChange={(e) => { setWeightText(e.target.value); setSaved(false) }} error={errors.weightPrice} hint="A loja online segue vendendo a embalagem pelo preço de venda." />}
      <SwitchRow label="Controlar lote e validade" hint="Obrigatório para alimentos perecíveis" checked={form.tracksExpiry} onChange={(v) => set('tracksExpiry', v)} />
      {!raw && (
        <div className={l.stack} style={{ gap: 6 }}>
          <label htmlFor={descId} style={{ fontWeight: 600 }}>Descrição na loja</label>
          <textarea id={descId} rows={3} value={form.description} onChange={(e) => set('description', e.target.value)} style={fieldStyle} />
        </div>
      )}
      <div role="status" aria-live="polite">
        {saved && <Banner tone="success">Produto salvo.</Banner>}
        {failed && <Banner tone="error">Não foi possível salvar. Nada foi alterado. Tente de novo.</Banner>}
      </div>
      <Footer>
        <Button type="submit" size="lg" fullWidth loading={busy}>{isNew ? 'Cadastrar produto' : 'Salvar'}</Button>
      </Footer>
    </form>
  )
}

export function NewProductPage() {
  const { admin } = useServices()
  const query = useQuery({
    queryKey: ['admin', 'product-blank'],
    queryFn: async (): Promise<ProductDetail> => {
      const cats = await admin.catalog.categories()
      return {
        id: '', label: 'Novo produto', unit: '', name: '', categoryId: cats[0]?.id ?? '', itemType: 'finished', origin: 'house', priceCents: null, weightPriceCents: null,
        minStock: '', published: false, favoritePos: false, soldByWeight: false, tracksExpiry: false, description: '', costCents: null, costSource: null,
        categories: cats.map((c) => ({ id: c.id, name: c.name })),
      }
    },
  })
  return (
    <>
      <ScreenHeader title="Novo produto" back="/gestao/produtos" />
      <main className={s.main} style={{ gap: 16, paddingTop: 16 }}>
        <QueryBoundary query={query} skeleton={<IndicatorSkeleton label="Carregando" />} errorTitle="Não foi possível abrir o cadastro">
          {(d) => <ProductForm key="novo" detail={d} isNew />}
        </QueryBoundary>
      </main>
    </>
  )
}

export function ProductPage() {
  const { id } = useParams()
  const query = useProduct(id)
  return (
    <>
      <ScreenHeader title={query.data?.label ?? 'Produto'} back="/gestao/produtos" />
      <main className={s.main} style={{ gap: 16, paddingTop: 16 }}>
        <QueryBoundary query={query} skeleton={<IndicatorSkeleton label="Carregando produto" />} errorTitle="Não foi possível carregar o produto">
          {(d) => (d ? <ProductForm key={d.id} detail={d} /> : <EmptyState icon="vender" title="Produto não encontrado" action={<ButtonLink href="/gestao/produtos">Ver produtos</ButtonLink>} />)}
        </QueryBoundary>
      </main>
    </>
  )
}

export function CategoriesPage() {
  const { admin } = useServices()
  const invalidate = useInvalidateCatalog()
  const query = useCategoryRows()
  const [name, setName] = useState('')
  const [error, setError] = useState<string | undefined>()
  const add = async (e: FormEvent) => {
    e.preventDefault()
    setError(undefined)
    try {
      await admin.catalog.addCategory(name)
      await invalidate()
      setName('')
    } catch (err) {
      setError((err as Error).message === 'duplicate' ? 'Já existe uma categoria com esse nome.' : 'Escreva o nome da categoria, por exemplo Castanhas.')
    }
  }
  return (
    <>
      <ScreenHeader title="Categorias" back="/gestao/produtos" />
      <main className={s.main} style={{ gap: 16, paddingTop: 16 }}>
        <QueryBoundary query={query} skeleton={<ListSkeleton rows={4} label="Carregando categorias" />} errorTitle="Não foi possível carregar as categorias">
          {(rows) => (
            <div className={l.linkList}>
              {rows.map((c) => (
                <div key={c.id} className={s.plainRow} style={{ justifyContent: 'space-between' }}>
                  <span className={l.grow}>
                    <span className={l.optionTitle}>{c.name}</span>
                    <span className={l.optionDetail}>{c.products} {c.products === 1 ? 'produto' : 'produtos'}</span>
                  </span>
                  <StatusTag tone={c.tag === 'Nova' ? 'info' : 'success'}>{c.tag}</StatusTag>
                </div>
              ))}
            </div>
          )}
        </QueryBoundary>
        <form onSubmit={add} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <TextField label="Nova categoria" placeholder="Ex.: Castanhas" value={name} onChange={(e) => setName(e.target.value)} error={error} />
          <Button type="submit" variant="secondary">Adicionar</Button>
        </form>
        <div className={l.sub}>A ordem aqui é a ordem dos atalhos na loja online.</div>
      </main>
    </>
  )
}
