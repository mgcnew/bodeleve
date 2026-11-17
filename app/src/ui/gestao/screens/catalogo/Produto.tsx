import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Box } from '@/components/Card'
import { Button, ButtonLink } from '@/components/Button'
import { Banner, EmptyState } from '@/components/Feedback'
import { RadioGroup, SelectField, TextAreaField, TextField, Toggle } from '@/components/Field'
import type { Item, ItemType, StockUnit } from '@/domain/backoffice'
import type { ProductOrigin } from '@/domain/catalog'
import { formatCents, parseCents } from '@/domain/money'
import { supabase } from '@/lib/supabase'
import { itemsStore } from '@/services/gestao/backoffice'
import { categoriesStore } from '@/services/gestao/people'
import { productErrorMessage, remoteArchiveProduct, remoteCreateProduct, remoteSaveProduct } from '@/services/gestao/peopleRemote'
import { Sheet } from '@/components/Sheet'
import { internalCategories } from '@/mocks/catalog'
import o from '@/styles/ops.module.css'
import { Bar, SumRow } from '../../../shared/OpsBits'
import { ProductPhoto } from '@/ui/loja/components/ProductCard'

const slugOf = (name: string) => name.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

const unitOptions: { value: StockUnit; label: string }[] = [
  { value: 'un', label: 'Unidade (un)' },
  { value: 'kg', label: 'Quilo (kg)' },
  { value: 'L', label: 'Litro (L)' },
  { value: 'ml', label: 'Mililitro (ml)' },
]

const blank = (categoryId: string): Item => ({
  id: '',
  name: '',
  unit: 'un',
  itemType: 'resale',
  origin: 'third_party',
  categoryId,
  minStock: 0,
  costCents: 0,
  priceCents: null,
  supplierId: null,
  tracksLots: false,
  soldByWeight: false,
  published: false,
  favoritePos: false,
})

const brl = (cents: number | null) => (cents === null ? '' : (cents / 100).toFixed(2).replace('.', ','))

// H-G25 — cadastro separa tipo de item e origem; liga/desliga loja, favorito no PDV, peso e lote
export function Produto() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const isNew = id === 'novo'
  const items = itemsStore.useStore()
  const found = items.find((i) => i.id === id)
  const categories = categoriesStore.useStore()
  // produto novo parte de um modelo em branco; o existente, do cadastro
  const item = isNew ? blank(categories[0]?.id ?? '') : found
  const [form, setForm] = useState<Item | null>(item ?? null)
  const [confirming, setConfirming] = useState(false)
  const [price, setPrice] = useState(brl(item?.priceCents ?? null))
  const [saved, setSaved] = useState(false)
  const [busy, setBusy] = useState(false)
  const [problem, setProblem] = useState<string>()

  useEffect(() => {
    setForm(item ?? null)
    setPrice(brl(item?.priceCents ?? null))
  }, [item?.id, isNew]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!item || !form) {
    return (
      <div className={o.screen}>
        <Bar title="Produto" back="/gestao/produtos" />
        <EmptyState bare icon="vender" title="Produto não encontrado" action={<ButtonLink to="/gestao/produtos">Ver produtos</ButtonLink>} />
      </div>
    )
  }

  const set = (patch: Partial<Item>) => {
    setForm({ ...form, ...patch })
    setSaved(false)
  }
  const raw = form.itemType === 'raw_material'
  const priceCents = parseCents(price)
  const margin = priceCents && priceCents > 0 ? Math.round(((priceCents - form.costCents) / priceCents) * 100) : null

  const save = async () => {
    if (!form.name.trim()) return setProblem('Digite o nome do produto.')
    if (!raw && form.published && !priceCents) return setProblem('Para publicar na loja, informe o preço de venda.')
    if (!raw && form.soldByWeight && !priceCents) return setProblem('Produto vendido por peso precisa do preço do quilo.')
    const next: Item = {
      ...form,
      priceCents: raw ? null : priceCents,
      origin: raw ? null : (form.origin ?? 'third_party'),
      published: raw ? false : form.published,
      favoritePos: raw ? false : form.favoritePos,
    }
    setBusy(true)
    setProblem(undefined)
    try {
      if (isNew) {
        if (supabase) await remoteCreateProduct(next)
        else {
          const base = slugOf(next.name) || 'produto'
          const slug = items.some((i) => i.id === base) ? `${base}-${items.length + 1}` : base
          itemsStore.set((all) => [...all, { ...next, id: slug }])
        }
        navigate('/gestao/produtos', { replace: true })
        return
      }
      if (supabase) await remoteSaveProduct(item, next)
      else itemsStore.set((all) => all.map((i) => (i.id === next.id ? next : i)))
      setSaved(true)
    } catch (e) {
      setProblem(productErrorMessage(e))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className={o.screen}>
      <Bar title={isNew ? 'Novo produto' : item.name} back="/gestao/produtos" />
      <main className={`${o.main} ${o.mainTop} ${o.narrow}`}>
 {!isNew && <ProductPhoto white label="[FOTO DO PRODUTO]" />}
        <TextField label="Nome" value={form.name} onChange={(e) => set({ name: e.target.value })} />
        <SelectField
          label="Categoria"
          value={form.categoryId}
          onChange={(e) => set({ categoryId: e.target.value })}
          options={[...categories, ...internalCategories].map((c) => ({ value: c.id, label: c.name }))}
        />
        {isNew && <SelectField label="Unidade de estoque" value={form.unit} onChange={(e) => set({ unit: e.target.value as StockUnit })} options={unitOptions} />}
        <RadioGroup<ItemType>
          legend="Tipo de item"
          name="tipo"
          value={form.itemType}
          onChange={(t) => set({ itemType: t })}
          options={[
            { value: 'finished', title: 'Produto acabado', sub: 'Produzido a partir de uma ficha técnica' },
            { value: 'resale', title: 'Revenda', sub: 'Comprado pronto de fornecedor' },
            { value: 'raw_material', title: 'Matéria-prima', sub: 'Usado na produção, não vai à venda' },
          ]}
        />
        {!raw && (
          <RadioGroup<ProductOrigin>
            legend="Origem na loja"
            name="origem"
            value={form.origin ?? 'third_party'}
            onChange={(origin) => set({ origin })}
            options={[
              { value: 'house_made', title: 'Feito na casa' },
              { value: 'bodeleve_brand', title: 'Marca Bodeleve', sub: 'Feito na casa ou por parceiro, com a marca' },
              { value: 'third_party', title: 'Terceiros', sub: 'Sem selo na loja' },
            ]}
          />
        )}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 10, alignItems: 'start' }}>
          {!raw && <TextField label="Preço de venda" inputMode="decimal" value={price} onChange={(e) => { setPrice(e.target.value); setSaved(false) }} />}
          <TextField label={`Estoque mínimo (${form.unit})`} inputMode="decimal" value={String(form.minStock)} onChange={(e) => set({ minStock: Number(e.target.value.replace(',', '.')) || 0 })} />
        </div>
        <div className={o.card}>
          <SumRow label={form.itemType === 'finished' ? 'Custo (da ficha técnica)' : 'Custo'} value={formatCents(form.costCents)} />
          {!raw && <SumRow label="Margem" value={margin === null ? '—' : `${margin}%`} />}
        </div>
        {!raw && (
          <Box>
            <Toggle label="Publicar na loja online" sub="Aparece no catálogo para clientes" checked={form.published} onChange={(v) => set({ published: v })} />
            <Toggle label="Favorito no PDV" sub="Fica na primeira tela do balcão" checked={form.favoritePos} onChange={(v) => set({ favoritePos: v })} />
            <Toggle label="Vendido por peso" sub="Pede o peso na hora da venda" checked={form.soldByWeight} onChange={(v) => set({ soldByWeight: v })} />
            <Toggle label="Controlar lote e validade" sub="Obrigatório para alimentos perecíveis" checked={form.tracksLots} onChange={(v) => set({ tracksLots: v })} />
          </Box>
        )}
        {!raw && <TextAreaField label="Descrição na loja" rows={3} value={form.description ?? '[DESCRIÇÃO DO PRODUTO]'} onChange={(e) => set({ description: e.target.value })} />}
        {saved && <Banner tone="success">Produto salvo.</Banner>}
        {problem && <Banner tone="error">{problem}</Banner>}
        {!isNew && (
          <Button variant="quiet" style={{ alignSelf: 'flex-start', padding: 0 }} onClick={() => setConfirming(true)}>
            Arquivar produto
          </Button>
        )}
      </main>
      <Sheet open={confirming} onClose={() => setConfirming(false)} title="Arquivar este produto?" variant="modal">
        <p className={o.muted}>
          {item.name} sai da loja, do balcão e do estoque. O histórico de vendas e compras continua guardado.
        </p>
        <Button
          variant="danger"
          block
          disabled={busy}
          onClick={async () => {
            setBusy(true)
            try {
              if (supabase) await remoteArchiveProduct(item)
              else itemsStore.set((all) => all.filter((i) => i.id !== item.id))
              navigate('/gestao/produtos', { replace: true })
            } catch (e) {
              setConfirming(false)
              setProblem(productErrorMessage(e))
            } finally {
              setBusy(false)
            }
          }}
        >
          Arquivar
        </Button>
        <Button variant="secondary" block onClick={() => setConfirming(false)}>
          Voltar
        </Button>
      </Sheet>
      <div className={o.footer}>
        <Button size="l" block onClick={() => void save()} disabled={busy}>
          {isNew ? 'Cadastrar produto' : 'Salvar'}
        </Button>
      </div>
    </div>
  )
}
