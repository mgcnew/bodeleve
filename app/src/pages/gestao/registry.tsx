import { useId, useState, type FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Banner, Button, ChoiceOption, EmptyState, IndicatorSkeleton, TextField, ButtonLink } from '@/components'
import { paymentTerms, type PaymentTermId } from '@/domain/purchasing'
import { leadDaysOf, validateCourier, validateRecipe, validateSupplier, type CourierInput, type RecipeInput, type SupplierInput } from '@/domain/registry'
import { parseMoney } from '@/lib/format'
import { useServices } from '@/services'
import { useInvalidateCatalog, useRecipe, useSupplier } from '@/ui/gestao/queries'
import { Footer, QueryBoundary, ScreenHeader } from '@/ui/loja/parts'
import s from '@/ui/gestao/gestao.module.css'
import l from '@/ui/loja/loja.module.css'

/** Cadastros da casa: fornecedor, ficha técnica e entregador (D33). Mesmo formulário para criar e para mudar. */

const fieldStyle = { width: '100%', padding: '10px 12px', borderRadius: 8, border: '1.5px solid var(--linha)', background: 'var(--superficie)', font: 'var(--corpo)', color: 'var(--texto)' } as const
const unmark = (t: string) => (t.trim().startsWith('[') ? '' : t)
const money = (cents: number) => (cents ? (cents / 100).toFixed(2).replace('.', ',') : '')

function Select({ label, value, onChange, children, disabled, error }: { label: string; value: string; onChange: (v: string) => void; children: React.ReactNode; disabled?: boolean; error?: string }) {
  const id = useId()
  return (
    <div className={l.stack} style={{ gap: 6 }}>
      <label htmlFor={id} style={{ fontWeight: 600 }}>{label}</label>
      <select id={id} value={value} disabled={disabled} onChange={(e) => onChange(e.target.value)} aria-invalid={error ? true : undefined} style={{ ...fieldStyle, height: 48 }}>{children}</select>
      {error && <div role="alert" className={l.sub} style={{ color: 'var(--erro)' }}>{error}</div>}
    </div>
  )
}

// ───────── Fornecedor ─────────

function SupplierForm({ id, initial }: { id: string | null; initial: SupplierInput }) {
  const { admin } = useServices()
  const navigate = useNavigate()
  const invalidate = useInvalidateCatalog()
  const [f, setF] = useState(initial)
  const [lead, setLead] = useState(initial.leadTimeDays == null ? '' : String(initial.leadTimeDays))
  const [errors, setErrors] = useState<ReturnType<typeof validateSupplier>>({})
  const [failed, setFailed] = useState(false)
  const [busy, setBusy] = useState(false)
  const set = <K extends keyof SupplierInput>(k: K, v: SupplierInput[K]) => setF((x) => ({ ...x, [k]: v }))

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    const input = { ...f, leadTimeDays: lead.trim() === '' ? null : Number(lead.replace(/\D/g, '')) }
    const errs = validateSupplier(input)
    setErrors(errs)
    setFailed(false)
    if (Object.keys(errs).length) return
    setBusy(true)
    try {
      const saved = await admin.purchasing.saveSupplier(id, input)
      await invalidate()
      navigate(`/gestao/fornecedores/${saved.id}`, { replace: true })
    } catch {
      setFailed(true)
      setBusy(false)
    }
  }
  return (
    <form onSubmit={submit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <TextField label="Nome do fornecedor" value={f.name} onChange={(e) => set('name', e.target.value)} error={errors.name} />
      <TextField label="O que fornece" hint="Por exemplo: Leite, requeijão, nata." value={f.supplies} onChange={(e) => set('supplies', e.target.value)} />
      <TextField label="Pessoa de contato" value={f.contactName} onChange={(e) => set('contactName', e.target.value)} />
      <TextField label="Celular" inputMode="tel" autoComplete="off" value={f.phone} onChange={(e) => set('phone', e.target.value)} error={errors.phone} />
      <TextField label="E-mail" type="email" autoComplete="off" value={f.email} onChange={(e) => set('email', e.target.value)} error={errors.email} />
      <TextField label="CNPJ ou CPF" inputMode="numeric" value={f.doc} onChange={(e) => set('doc', e.target.value)} />
      <Select label="Pagamento padrão" value={f.defaultPayment} onChange={(v) => set('defaultPayment', v as PaymentTermId)}>
        {(Object.keys(paymentTerms) as PaymentTermId[]).map((k) => <option key={k} value={k}>{paymentTerms[k].label}</option>)}
      </Select>
      <TextField label="Prazo de entrega (dias)" inputMode="numeric" value={lead} onChange={(e) => setLead(e.target.value)} error={errors.leadTime} />
      <div role="status" aria-live="polite">{failed && <Banner tone="error">Não foi possível salvar. Nada foi alterado. Tente de novo.</Banner>}</div>
      <Footer><Button type="submit" size="lg" fullWidth loading={busy}>{id ? 'Salvar' : 'Cadastrar fornecedor'}</Button></Footer>
    </form>
  )
}

export function SupplierFormPage() {
  const { id } = useParams()
  const query = useSupplier(id)
  const blank: SupplierInput = { name: '', supplies: '', contactName: '', phone: '', email: '', doc: '', defaultPayment: 'boleto14', leadTimeDays: null }
  return (
    <>
      <ScreenHeader title={id ? 'Editar fornecedor' : 'Novo fornecedor'} back={id ? `/gestao/fornecedores/${id}` : '/gestao/fornecedores'} />
      <main className={s.main} style={{ gap: 16, paddingTop: 16 }}>
        {!id ? (
          <SupplierForm id={null} initial={blank} />
        ) : (
          <QueryBoundary query={query} skeleton={<IndicatorSkeleton label="Carregando fornecedor" />} errorTitle="Não foi possível carregar o fornecedor">
            {(f) => f ? (
              <SupplierForm key={f.id} id={f.id} initial={{ name: f.name, supplies: f.supplies, contactName: unmark(f.contactName), phone: f.phone, email: unmark(f.email), doc: unmark(f.doc), defaultPayment: f.defaultPayment, leadTimeDays: leadDaysOf(f.leadTime) }} />
            ) : <EmptyState icon="entregas" title="Fornecedor não encontrado" action={<ButtonLink href="/gestao/fornecedores">Ver fornecedores</ButtonLink>} />}
          </QueryBoundary>
        )}
      </main>
    </>
  )
}

// ───────── Ficha técnica ─────────

type Line = { itemId: string; qty: string }

function RecipeForm({ id, initial }: { id: string | null; initial: RecipeInput }) {
  const { admin } = useServices()
  const navigate = useNavigate()
  const invalidate = useInvalidateCatalog()
  const options = useQuery({ queryKey: ['admin', 'recipe-options'], queryFn: () => admin.production.recipeOptions() })
  const [f, setF] = useState(initial)
  const [yieldText, setYieldText] = useState(initial.yieldPerBatch ? String(initial.yieldPerBatch) : '')
  const [shelf, setShelf] = useState(String(initial.shelfLifeDays))
  const [overhead, setOverhead] = useState(money(initial.overheadCents))
  const [lines, setLines] = useState<Line[]>(initial.lines.length ? initial.lines.map((x) => ({ itemId: x.itemId, qty: String(x.qtyPerBatch) })) : [{ itemId: '', qty: '' }])
  const [errors, setErrors] = useState<ReturnType<typeof validateRecipe>>({})
  const [failed, setFailed] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const num = (t: string) => Number(t.replace(',', '.'))
  const setLine = (i: number, patch: Partial<Line>) => setLines((ls) => ls.map((x, j) => (j === i ? { ...x, ...patch } : x)))

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    const input: RecipeInput = {
      ...f, yieldPerBatch: num(yieldText), shelfLifeDays: shelf.trim() === '' ? 0 : Number(shelf), overheadCents: overhead.trim() ? parseMoney(overhead) ?? 0 : 0,
      lines: lines.filter((x) => x.itemId).map((x) => ({ itemId: x.itemId, qtyPerBatch: num(x.qty) })),
    }
    const errs = validateRecipe(input)
    setErrors(errs)
    setFailed(null)
    if (Object.keys(errs).length) return
    setBusy(true)
    try {
      const saved = await admin.production.saveRecipe(id, input)
      await invalidate()
      navigate(`/gestao/producao/fichas/${saved.id}`, { replace: true })
    } catch (err) {
      setFailed((err as Error).message === 'duplicate' ? 'Esse produto já tem ficha técnica. Abra a ficha dele para mudar.' : 'Não foi possível salvar. Nada foi alterado. Tente de novo.')
      setBusy(false)
    }
  }
  return (
    <form onSubmit={submit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <QueryBoundary query={options} skeleton={<IndicatorSkeleton label="Carregando produtos" />} errorTitle="Não foi possível carregar os produtos">
        {(o) => (
          <>
            <Select label="Produto que sai desta ficha" value={f.itemId} disabled={id !== null} onChange={(v) => setF((x) => ({ ...x, itemId: v }))} error={errors.item}>
              <option value="">Escolha o produto</option>
              {o.products.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
            </Select>
            {o.products.length === 0 && <div className={l.sub}>Só produtos do tipo “Produto acabado” têm ficha. Cadastre um em Produtos primeiro.</div>}
            <TextField label="Rendimento por fornada (unidades)" inputMode="decimal" value={yieldText} onChange={(e) => setYieldText(e.target.value)} error={errors.yield} />
            <TextField label="Nome da fornada" hint="Por exemplo: fornada, tacho, lote." value={f.batchLabel} onChange={(e) => setF((x) => ({ ...x, batchLabel: e.target.value }))} />
            <TextField label="Validade do produto (dias)" inputMode="numeric" value={shelf} onChange={(e) => setShelf(e.target.value)} error={errors.shelfLife} />
            <TextField label="Prefixo do lote" hint="Por exemplo: QC. O lote sai como QC-261116-1." value={f.lotPrefix} onChange={(e) => setF((x) => ({ ...x, lotPrefix: e.target.value }))} />
            <TextField label="Gás e energia por fornada (R$)" inputMode="decimal" value={overhead} onChange={(e) => setOverhead(e.target.value)} />
            <fieldset className={l.fieldset} style={{ gap: 12 }}>
              <legend style={{ fontWeight: 600 }}>Insumos por fornada</legend>
              <div className={l.sub}>A quantidade é em unidades de estoque, como aparecem no Estoque.</div>
              {lines.map((ln, i) => (
                <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
                  <div style={{ flex: 1 }}>
                    <Select label={`Insumo ${i + 1}`} value={ln.itemId} onChange={(v) => setLine(i, { itemId: v })}>
                      <option value="">Escolha o insumo</option>
                      {o.inputs.filter((x) => x.id !== f.itemId).map((x) => <option key={x.id} value={x.id}>{x.label}</option>)}
                    </Select>
                  </div>
                  <div style={{ width: 96 }}><TextField label="Quantidade" inputMode="decimal" value={ln.qty} onChange={(e) => setLine(i, { qty: e.target.value })} /></div>
                  <Button type="button" variant="secondary" aria-label={`Remover insumo ${i + 1}`} onClick={() => setLines((ls) => (ls.length > 1 ? ls.filter((_, j) => j !== i) : [{ itemId: '', qty: '' }]))}>Remover</Button>
                </div>
              ))}
              {errors.lines && <div role="alert" className={l.sub} style={{ color: 'var(--erro)' }}>{errors.lines}</div>}
              <Button type="button" variant="secondary" onClick={() => setLines((ls) => [...ls, { itemId: '', qty: '' }])}>Adicionar insumo</Button>
            </fieldset>
            <div className={l.stack} style={{ gap: 6 }}>
              <label htmlFor="modo" style={{ fontWeight: 600 }}>Modo de preparo</label>
              <textarea id="modo" rows={4} value={f.method} placeholder="[MODO DE PREPARO DA CASA]" onChange={(e) => setF((x) => ({ ...x, method: e.target.value }))} style={fieldStyle} />
            </div>
          </>
        )}
      </QueryBoundary>
      <div role="status" aria-live="polite">{failed && <Banner tone="error">{failed}</Banner>}</div>
      <Footer><Button type="submit" size="lg" fullWidth loading={busy}>{id ? 'Salvar ficha' : 'Cadastrar ficha'}</Button></Footer>
    </form>
  )
}

export function RecipeFormPage() {
  const { id } = useParams()
  const query = useRecipe(id)
  const blank: RecipeInput = { itemId: '', yieldPerBatch: 0, batchLabel: 'fornada', shelfLifeDays: 0, lotPrefix: '', overheadCents: 0, method: '', lines: [] }
  return (
    <>
      <ScreenHeader title={id ? 'Editar ficha técnica' : 'Nova ficha técnica'} back={id ? `/gestao/producao/fichas/${id}` : '/gestao/producao/fichas'} />
      <main className={s.main} style={{ gap: 16, paddingTop: 16 }}>
        {!id ? (
          <RecipeForm id={null} initial={blank} />
        ) : (
          <QueryBoundary query={query} skeleton={<IndicatorSkeleton label="Carregando ficha" />} errorTitle="Não foi possível carregar a ficha">
            {(r) => r ? (
              <RecipeForm key={r.id} id={r.id} initial={{ itemId: r.itemId, yieldPerBatch: r.yieldPerBatch, batchLabel: r.batchLabel, shelfLifeDays: r.shelfLifeDays, lotPrefix: r.lotPrefix, overheadCents: r.overheadCents, method: unmark(r.method), lines: r.lines.map((x) => ({ itemId: x.itemId, qtyPerBatch: x.qtyPerBatch })) }} />
            ) : <EmptyState icon="producao" title="Ficha não encontrada" action={<ButtonLink href="/gestao/producao/fichas">Ver fichas</ButtonLink>} />}
          </QueryBoundary>
        )}
      </main>
    </>
  )
}

// ───────── Entregador ─────────

function CourierForm({ id, initial }: { id: string | null; initial: CourierInput }) {
  const { admin } = useServices()
  const navigate = useNavigate()
  const invalidate = useInvalidateCatalog()
  const [f, setF] = useState(initial)
  const [errors, setErrors] = useState<ReturnType<typeof validateCourier>>({})
  const [failed, setFailed] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const submit = async (e: FormEvent) => {
    e.preventDefault()
    const errs = validateCourier(f)
    setErrors(errs)
    setFailed(null)
    if (Object.keys(errs).length) return
    setBusy(true)
    try {
      await admin.deliveries.saveCourier(id, f)
      await invalidate()
      navigate('/gestao/entregas', { replace: true })
    } catch (err) {
      setFailed((err as Error).message === 'duplicate' ? 'Esse celular já está cadastrado em outro entregador.' : 'Não foi possível salvar. Nada foi alterado. Tente de novo.')
      setBusy(false)
    }
  }
  return (
    <form onSubmit={submit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <TextField label="Nome" value={f.name} onChange={(e) => setF((x) => ({ ...x, name: e.target.value }))} error={errors.name} />
      <fieldset className={l.fieldset}>
        <legend style={{ fontWeight: 600 }}>Como trabalha</legend>
        <ChoiceOption type="radio" name="tipo" checked={f.kind === 'own'} onChange={() => setF((x) => ({ ...x, kind: 'own' }))}><b>Da casa</b><br /><span className={l.sub}>Recebe por mês</span></ChoiceOption>
        <ChoiceOption type="radio" name="tipo" checked={f.kind === 'partner'} onChange={() => setF((x) => ({ ...x, kind: 'partner' }))}><b>Parceiro</b><br /><span className={l.sub}>Recebe por entrega, por Pix</span></ChoiceOption>
      </fieldset>
      <TextField label="Celular" hint="É com este número que a pessoa entra no app de Entregas." inputMode="tel" autoComplete="off" value={f.phone} onChange={(e) => setF((x) => ({ ...x, phone: e.target.value }))} error={errors.phone} />
      <TextField label="Veículo" hint="Por exemplo: Moto · placa." value={f.vehicle} onChange={(e) => setF((x) => ({ ...x, vehicle: e.target.value }))} />
      <div role="status" aria-live="polite">{failed && <Banner tone="error">{failed}</Banner>}</div>
      <Footer><Button type="submit" size="lg" fullWidth loading={busy}>{id ? 'Salvar' : 'Cadastrar entregador'}</Button></Footer>
    </form>
  )
}

export function CourierFormPage() {
  const { id } = useParams()
  const { admin } = useServices()
  const query = useQuery({ queryKey: ['admin', 'courier', id], queryFn: () => admin.deliveries.getCourier(id!), enabled: !!id })
  return (
    <>
      <ScreenHeader title={id ? 'Editar entregador' : 'Novo entregador'} back="/gestao/entregas" />
      <main className={s.main} style={{ gap: 16, paddingTop: 16 }}>
        {!id ? (
          <CourierForm id={null} initial={{ name: '', kind: 'own', phone: '', vehicle: '' }} />
        ) : (
          <QueryBoundary query={query} skeleton={<IndicatorSkeleton label="Carregando entregador" />} errorTitle="Não foi possível carregar o entregador">
            {(c) => c ? <CourierForm key={c.id} id={c.id} initial={{ name: c.name, kind: c.kind, phone: c.phone, vehicle: c.vehicle.startsWith('[') ? '' : c.vehicle }} /> : <EmptyState icon="entregas" title="Entregador não encontrado" action={<ButtonLink href="/gestao/entregas">Ver entregas</ButtonLink>} />}
          </QueryBoundary>
        )}
      </main>
    </>
  )
}
