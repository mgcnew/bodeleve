import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Button, ButtonLink } from '@/components/Button'
import { Banner, EmptyState } from '@/components/Feedback'
import { SelectField, TextAreaField, TextField } from '@/components/Field'
import { Icon } from '@/components/Icon'
import type { Recipe } from '@/domain/backoffice'
import { parseCents } from '@/domain/money'
import { supabase } from '@/lib/supabase'
import { itemsStore, newId, recipesStore } from '@/services/gestao/backoffice'
import { backofficeErrorMessage, RECIPE_NOTES_PLACEHOLDER, remoteSaveRecipe } from '@/services/gestao/backofficeRemote'
import o from '@/styles/ops.module.css'
import { Bar } from '../../../shared/OpsBits'

const num = (text: string) => Number(text.replace(',', '.'))
const brl = (cents: number) => (cents / 100).toFixed(2).replace('.', ',')
type Line = { itemId: string; qty: string }

// cadastro e edição de ficha técnica (fichas/nova e fichas/:id/editar). O que entra, quanto rende e o custo indireto.
export function FichaForm() {
  const { id } = useParams()
  const existing = recipesStore.useStore().find((r) => r.id === id)
  if (id && !existing) {
    return (
      <div className={o.screen}>
        <Bar title="Ficha técnica" back="/gestao/producao/fichas" />
        <EmptyState bare icon="producao" title="Ficha não encontrada" action={<ButtonLink to="/gestao/producao/fichas">Ver fichas</ButtonLink>} />
      </div>
    )
  }
  // a chave refaz o formulário quando os dados chegam depois da tela (abrir direto pelo endereço)
  return <FichaFormBody key={`${existing?.id ?? 'nova'}|${existing?.lotPrefix ?? ''}`} existing={existing} />
}

function FichaFormBody({ existing }: { existing?: Recipe }) {
  const navigate = useNavigate()
  const items = itemsStore.useStore()
  const recipes = recipesStore.useStore()

  const withRecipe = new Set(recipes.map((r) => r.productId))
  const candidates = items.filter((i) => i.itemType === 'finished' && (!withRecipe.has(i.id) || i.id === existing?.productId))
  const inputs = items.filter((i) => i.itemType !== 'finished')

  const [productId, setProductId] = useState(existing?.productId ?? candidates[0]?.id ?? '')
  const [yieldQty, setYieldQty] = useState(existing ? String(existing.yieldQty) : '')
  const [batchLabel, setBatchLabel] = useState(existing?.batchLabel ?? 'fornada')
  const [shelfLife, setShelfLife] = useState(existing ? String(existing.shelfLifeDays) : '')
  const [lotPrefix, setLotPrefix] = useState(existing?.lotPrefix ?? '')
  const [overhead, setOverhead] = useState(existing ? brl(existing.indirectCostCents) : '')
  const [notes, setNotes] = useState(existing && existing.prepNotes !== RECIPE_NOTES_PLACEHOLDER ? existing.prepNotes : '')
  const [lines, setLines] = useState<Line[]>(existing?.lines.map((l) => ({ itemId: l.itemId, qty: String(l.qty) })) ?? [{ itemId: inputs[0]?.id ?? '', qty: '' }])
  const [problem, setProblem] = useState<string>()
  const [busy, setBusy] = useState(false)

  if (!existing && candidates.length === 0) {
    return (
      <div className={o.screen}>
        <Bar title="Nova ficha" back="/gestao/producao/fichas" />
        <EmptyState bare icon="producao" title="Nenhum produto sem ficha" text="A ficha é de um produto acabado. Cadastre o produto como “Produto acabado” e volte aqui." action={<ButtonLink to="/gestao/produtos/novo">Novo produto</ButtonLink>} />
      </div>
    )
  }

  const setLine = (i: number, patch: Partial<Line>) => {
    setLines(lines.map((l, k) => (k === i ? { ...l, ...patch } : l)))
    setProblem(undefined)
  }

  const save = async () => {
    const yq = num(yieldQty)
    const clean = lines.filter((l) => l.itemId && l.qty.trim() !== '')
    if (!productId) return setProblem('Escolha o produto da ficha.')
    if (!(yq > 0)) return setProblem('Informe quantas unidades rende cada fornada.')
    if (clean.length === 0) return setProblem('Coloque pelo menos um insumo com a quantidade.')
    if (clean.some((l) => !(num(l.qty) > 0))) return setProblem('Confira as quantidades: precisam ser maiores que zero.')
    if (new Set(clean.map((l) => l.itemId)).size !== clean.length) return setProblem('Há um insumo repetido. Junte as quantidades numa linha só.')
    const input = {
      productId,
      yieldQty: yq,
      batchLabel: batchLabel.trim() || 'fornada',
      shelfLifeDays: Math.max(0, Math.round(num(shelfLife) || 0)),
      lotPrefix: lotPrefix.trim().toUpperCase(),
      indirectCostCents: Math.max(0, parseCents(overhead) ?? 0),
      prepNotes: notes.trim(),
      lines: clean.map((l) => ({ itemId: l.itemId, qty: num(l.qty) })),
    }
    setBusy(true)
    setProblem(undefined)
    try {
      let savedId: string
      if (supabase) savedId = await remoteSaveRecipe(existing?.id ?? null, input)
      else {
        savedId = existing?.id ?? newId('ficha')
        const next: Recipe = { id: savedId, productId, yieldQty: yq, batchLabel: input.batchLabel, shelfLifeDays: input.shelfLifeDays, lotPrefix: input.lotPrefix, indirectCostCents: input.indirectCostCents, prepNotes: input.prepNotes || RECIPE_NOTES_PLACEHOLDER, lines: input.lines }
        recipesStore.set((all) => (existing ? all.map((r) => (r.id === savedId ? next : r)) : [...all, next]))
      }
      navigate(`/gestao/producao/fichas/${savedId}`, { replace: true })
    } catch (e) {
      setProblem(backofficeErrorMessage(e))
      setBusy(false)
    }
  }

  return (
    <div className={o.screen}>
      <Bar title={existing ? 'Editar ficha' : 'Nova ficha'} back={existing ? `/gestao/producao/fichas/${existing.id}` : '/gestao/producao/fichas'} />
      <main className={`${o.main} ${o.mainTop} ${o.narrow}`}>
        {existing ? (
          <p className={o.bold}>{items.find((i) => i.id === existing.productId)?.name}</p>
        ) : (
          <SelectField label="Produto" value={productId} onChange={(e) => setProductId(e.target.value)} options={candidates.map((i) => ({ value: i.id, label: i.name }))} />
        )}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 10, alignItems: 'start' }}>
          <TextField label="Rende (unidades boas)" inputMode="decimal" value={yieldQty} onChange={(e) => setYieldQty(e.target.value)} />
          <TextField label="Chamamos de" help="Ex.: fornada, tacho, lote" value={batchLabel} onChange={(e) => setBatchLabel(e.target.value)} />
          <TextField label="Validade (dias)" inputMode="numeric" value={shelfLife} onChange={(e) => setShelfLife(e.target.value)} />
          <TextField label="Prefixo do lote" help="Ex.: DL" value={lotPrefix} onChange={(e) => setLotPrefix(e.target.value)} />
        </div>
        <section className={o.section}>
          <h2 className={o.h2}>O que entra em cada {batchLabel.trim() || 'fornada'}</h2>
          {lines.map((l, i) => {
            const unit = inputs.find((x) => x.id === l.itemId)?.unit ?? ''
            return (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 110px 44px', gap: 8, alignItems: 'end' }}>
                <SelectField label={i === 0 ? 'Insumo' : `Insumo ${i + 1}`} value={l.itemId} onChange={(e) => setLine(i, { itemId: e.target.value })} options={[{ value: '', label: 'Escolha' }, ...inputs.map((x) => ({ value: x.id, label: x.name }))]} />
                <TextField label={`Qtd${unit ? ` (${unit})` : ''}`} inputMode="decimal" value={l.qty} onChange={(e) => setLine(i, { qty: e.target.value })} />
                <button type="button" aria-label={`Tirar o insumo ${i + 1}`} disabled={lines.length === 1} onClick={() => setLines(lines.filter((_, k) => k !== i))} style={{ width: 44, height: 48, border: 0, background: 'transparent', color: 'var(--texto-secundario)', cursor: 'pointer' }}>
                  <Icon name="fechar" size={20} />
                </button>
              </div>
            )
          })}
          <Button variant="secondary" onClick={() => setLines([...lines, { itemId: '', qty: '' }])}>
            Adicionar insumo
          </Button>
        </section>
        <TextField label="Gás e energia por fornada (R$)" help="Custo indireto estimado" inputMode="decimal" value={overhead} onChange={(e) => setOverhead(e.target.value)} />
        <TextAreaField label="Modo de preparo" rows={4} value={notes} onChange={(e) => setNotes(e.target.value)} />
        {problem && <Banner tone="error">{problem}</Banner>}
      </main>
      <div className={o.footer}>
        <Button size="l" block disabled={busy} onClick={() => void save()}>
          {existing ? 'Salvar ficha' : 'Criar ficha'}
        </Button>
      </div>
    </div>
  )
}
