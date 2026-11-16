import { useMemo, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { BagBar, BottomSheet, Button, ButtonLink, Chip, EmptyState, FavoriteTile, IconButton, IndicatorSkeleton, ListSkeleton, QuantityStepper, SearchField, Tabs, TextField, WeightField } from '@/components'
import { hhmm } from '@/domain/deliveries'
import { discountKinds, discountLabel, discountReasons, openingValues, withDiscount, type DiscountKind } from '@/domain/pos'
import { formatKg, formatKgShort, unitsToKg } from '@/domain/units'
import { formatBRL, parseDecimal, parseMoney } from '@/lib/format'
import { useServices } from '@/services'
import type { PosProduct } from '@/services/types'
import { useAdminSession } from '@/store/admin'
import { usePosCart } from '@/store/pos'
import { priceCart } from '@/ui/pdv/cart'
import { useInvalidatePos, usePosCatalog, usePosOverview } from '@/ui/pdv/queries'
import p from '@/ui/pdv/pdv.module.css'
import { Footer, QueryBoundary, ScreenHeader } from '@/ui/loja/parts'
import s from '@/ui/gestao/gestao.module.css'
import l from '@/ui/loja/loja.module.css'

const norm = (t: string) => t.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
const priceText = (p: PosProduct) => (p.perKg ? `${formatBRL(p.priceCents)}/kg` : formatBRL(p.priceCents)).replace('R$ ', '')

/** Atalho do PDV: entra sem caixa aberto → abertura; com caixa → vender. */
export function PdvHome() {
  const query = usePosOverview()
  if (query.isPending) return <IndicatorSkeleton label="Carregando o balcão" />
  return <Navigate to={query.data?.session ? '/pdv/vender' : '/pdv/abertura'} replace />
}

export function OpeningPage() {
  const navigate = useNavigate()
  const { admin } = useServices()
  const user = useAdminSession((x) => x.user)
  const invalidate = useInvalidatePos()
  const query = usePosOverview()
  const [text, setText] = useState('R$ 150,00')
  const [error, setError] = useState<string | undefined>()
  const [busy, setBusy] = useState(false)
  const now = new Date()
  const cents = parseMoney(text)

  const open = async () => {
    if (cents == null) return setError('Informe o valor em dinheiro, por exemplo R$ 150,00.')
    setBusy(true)
    try {
      await admin.pos.openSession(cents, user?.name ?? 'Balcão')
      await invalidate()
      navigate('/pdv/vender', { replace: true })
    } catch (e) {
      setError((e as Error).message === 'session_open' ? 'Já existe um caixa aberto.' : 'Não foi possível abrir o caixa. Tente de novo.')
      setBusy(false)
    }
  }

  if (query.data?.session) return <Navigate to="/pdv/vender" replace />
  const last = query.data?.lastClose
  return (
    <>
      <main className={s.main} style={{ gap: 16, paddingTop: 24 }}>
        <div className={l.stack} style={{ gap: 4 }}>
          <h1 className={l.h1}>Abrir caixa</h1>
          <div className={l.sub}>Balcão · {now.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: '2-digit' })} · {hhmm(now.toISOString())}</div>
        </div>
        <div className={l.linkList}>
          <div className={s.plainRow} style={{ justifyContent: 'space-between' }}><span>Quem abre</span><b>{user?.name ?? '—'}</b></div>
          <div className={s.plainRow} style={{ justifyContent: 'space-between' }}>
            <span>Último fechamento</span>
            <b>{last ? `${new Date(last.at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })} · ${last.differenceCents === 0 ? 'sem diferença' : `${last.differenceCents < 0 ? 'faltou' : 'sobrou'} ${formatBRL(Math.abs(last.differenceCents))}`}` : 'primeiro caixa'}</b>
          </div>
        </div>
        <TextField label="Dinheiro na gaveta para troco" inputMode="decimal" value={text} onChange={(e) => { setText(e.target.value); setError(undefined) }} error={error} />
        <div role="group" aria-label="Valores comuns" className={s.filters}>
          {openingValues.map((v) => <Chip key={v} selected={cents === v} onClick={() => { setText(formatBRL(v)); setError(undefined) }}>R$ {v / 100}</Chip>)}
        </div>
        <div className={l.sub}>Conte o dinheiro antes de abrir. Esse valor é a base para conferir o caixa no fechamento.</div>
      </main>
      <Footer>
        <Button size="lg" fullWidth loading={busy} onClick={open}>Abrir caixa</Button>
      </Footer>
    </>
  )
}

type Mode = 'fav' | 'cat' | 'search'

export function SellPage() {
  const catalog = usePosCatalog()
  const overview = usePosOverview()
  const { lines, discount, addUnit, addWeight, clear } = usePosCart()
  const [mode, setMode] = useState<Mode>('fav')
  const [cat, setCat] = useState<string | null>(null)
  const [q, setQ] = useState('')
  const [sheet, setSheet] = useState<PosProduct | null>(null)
  const [kgText, setKgText] = useState('0,500')
  const [notice, setNotice] = useState('')

  const priced = useMemo(() => priceCart(lines, catalog.data?.products ?? [], discount), [lines, catalog.data, discount])
  if (overview.data && !overview.data.session) return <Navigate to="/pdv/abertura" replace />

  const inBag = (p: PosProduct) => lines.filter((x) => x.itemId === p.id).reduce((a, x) => a + (x.kind === 'unit' ? x.qty : 0), 0)
  const tap = (p: PosProduct) => {
    setNotice('')
    if (p.out) return setNotice(`Sem estoque de ${p.name}.`)
    if (p.perKg) {
      setKgText('0,500')
      return setSheet(p)
    }
    if (inBag(p) + 1 > p.availableUnits) return setNotice(`Só há ${p.stockText} de ${p.name} em estoque.`)
    addUnit(p.id)
  }

  const kg = parseDecimal(kgText)
  const sheetStockKg = sheet ? unitsToKg(sheet.availableUnits, sheet.unit) : 0
  const bagKgOfSheet = sheet ? lines.filter((x) => x.itemId === sheet.id).reduce((a, x) => a + x.qty, 0) : 0
  const overStock = sheet != null && kg != null && kg + bagKgOfSheet > sheetStockKg + 1e-9
  const sheetTotal = sheet && kg ? Math.round(sheet.priceCents * kg) : 0
  const setKg = (v: number) => setKgText(String(Math.round(Math.max(0.05, v) * 1000) / 1000).replace('.', ',').padEnd(1, '0'))

  const shown = (catalog.data?.products ?? []).filter((p) => (mode === 'fav' ? p.favorite : mode === 'cat' ? (cat ?? catalog.data?.categories[0]?.id) === p.categoryId : !q.trim() || norm(p.name).includes(norm(q))))
  const activeCat = cat ?? catalog.data?.categories[0]?.id

  return (
    <>
      <div className={p.sell}>
      <div>
      <div style={{ padding: '0 16px' }}>
        <Tabs<Mode> label="Como achar o produto" value={mode} onChange={setMode} tabs={[{ value: 'fav', label: 'Favoritos' }, { value: 'cat', label: 'Categorias' }, { value: 'search', label: 'Buscar' }]} />
      </div>
      <main className={s.main} style={{ gap: 12, paddingTop: 12 }}>
        {mode === 'cat' && (
          <div role="group" aria-label="Categoria" className={s.filters}>
            {catalog.data?.categories.map((c) => <Chip key={c.id} selected={activeCat === c.id} onClick={() => setCat(c.id)}>{c.name}</Chip>)}
          </div>
        )}
        {mode === 'search' && <SearchField label="Buscar produto" placeholder="Nome do produto" value={q} onChange={(e) => setQ(e.target.value)} />}
        <QueryBoundary query={catalog} skeleton={<ListSkeleton rows={4} label="Carregando produtos" />} errorTitle="Não foi possível carregar os produtos">
          {() =>
            shown.length === 0 ? (
              <EmptyState icon="buscar" title={mode === 'search' ? 'Nenhum produto com esse nome.' : 'Nenhum produto aqui'} description={mode === 'fav' ? 'Marque favoritos em Produtos, na gestão.' : undefined} />
            ) : (
              <div className={p.grid}>
                {shown.map((p) => (
                  <FavoriteTile key={p.id} name={p.name} price={priceText(p)} stock={p.out ? 'sem estoque' : p.stockText} lowStock={p.low && !p.out} onClick={() => tap(p)} />
                ))}
              </div>
            )
          }
        </QueryBoundary>
        <div role="status" aria-live="polite" className={l.sub} style={{ minHeight: 20 }}>{notice}</div>
        <div className={l.sub}>Toque para somar 1. Produtos por peso pedem o peso antes.</div>
      </main>
      </div>
      <aside aria-label="Sacola" className={p.aside}>
        <h2 style={{ font: '700 17px/24px var(--fonte-titulo)', margin: 0 }}>Sacola</h2>
        <div className={p.asideLines}>
          {priced.lines.length === 0 ? <div className={l.sub}>Toque nos produtos para somar.</div> : priced.lines.map((ln) => (
            <div key={ln.key} className={p.asideLine}>
              <div>{ln.name}{ln.kind === 'weight' ? ` · ${formatKg(ln.qty)}` : ln.qty > 1 ? ` × ${ln.qty}` : ''}</div>
              <b>{formatBRL(ln.totalCents)}</b>
            </div>
          ))}
        </div>
        <div className={p.asideLine} style={{ fontWeight: 700 }}><span>Total</span><span>{formatBRL(priced.totalCents)}</span></div>
        <ButtonLink href="/pdv/sacola" size="lg" fullWidth>Cobrar</ButtonLink>
        <Button variant="ghost" fullWidth disabled={priced.lines.length === 0} onClick={() => clear()}>Limpar sacola</Button>
        <div className={l.sub}>Produtos por peso abrem o peso numa janela central.</div>
      </aside>
      </div>
      {priced.count > 0 && <div className={p.mobileOnly}><BagBar itemCount={priced.count} totalCents={priced.totalCents} href="/pdv/sacola" /></div>}


      <BottomSheet open={sheet != null} onClose={() => setSheet(null)} title={sheet?.name ?? 'Peso'} description={sheet ? `${formatBRL(sheet.priceCents)} o quilo` : undefined}>
        {sheet && (
          <div className={l.stack} style={{ gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8 }}>
              <IconButton label="Diminuir" icon="remover" onClick={() => setKg((kg ?? 0.5) - 0.05)} />
              <div className={l.grow}>
                <WeightField
                  value={kgText}
                  onChange={setKgText}
                  shortcuts={[{ label: '250 g', kg: 0.25 }, { label: '500 g', kg: 0.5 }, { label: '1 kg', kg: 1 }]}
                  currentKg={kg}
                  onShortcut={(v) => setKg(v)}
                  summary={kg ? `${formatKg(kg)} × ${formatBRL(sheet.priceCents)}` : undefined}
                />
              </div>
              <IconButton label="Aumentar" icon="adicionar" onClick={() => setKg((kg ?? 0.5) + 0.05)} />
            </div>
            {overStock && <div role="alert" className={l.sub} style={{ color: 'var(--erro)' }}>Só há {formatKgShort(Math.max(0, sheetStockKg - bagKgOfSheet))} em estoque.</div>}
            <Button size="lg" fullWidth disabled={!kg || kg <= 0 || overStock} onClick={() => { addWeight(sheet.id, kg!); setSheet(null) }}>Adicionar · {formatBRL(sheetTotal)}</Button>
            <Button variant="ghost" fullWidth onClick={() => setSheet(null)}>Cancelar</Button>
          </div>
        )}
      </BottomSheet>
    </>
  )
}

export function BagPage() {
  const catalog = usePosCatalog()
  const { lines, discount, setQty, remove, setDiscount } = usePosCart()
  const [open, setOpen] = useState(false)
  const [pick, setPick] = useState<DiscountKind>('p5')
  const [reason, setReason] = useState(discountReasons[0])
  const priced = useMemo(() => priceCart(lines, catalog.data?.products ?? [], discount), [lines, catalog.data, discount])
  const stock = (id: string) => catalog.data?.products.find((p) => p.id === id)?.availableUnits ?? 0
  const preview = withDiscount(pick, reason, priced.subtotalCents)

  return (
    <>
      <ScreenHeader title="Sacola" back="/pdv/vender" />
      <main className={s.main} style={{ gap: 12, paddingTop: 12 }}>
        <QueryBoundary query={catalog} skeleton={<ListSkeleton rows={3} label="Carregando a sacola" />} errorTitle="Não foi possível carregar a sacola">
          {() =>
            priced.lines.length === 0 ? (
              <EmptyState icon="sacola" title="Sacola vazia" description="Toque nos produtos para somar." action={<ButtonLink href="/pdv/vender">Vender</ButtonLink>} />
            ) : (
              <>
                <div className={l.linkList}>
                  {priced.lines.map((ln) => (
                    <div key={ln.key} className={s.plainRow} style={{ minHeight: 72 }}>
                      <span className={l.grow}>
                        <span className={l.optionTitle}>{ln.name}</span>
                        <span className={l.optionDetail}>{ln.kind === 'weight' ? `${formatKg(ln.qty)} × ${formatBRL(ln.unitPriceCents)}` : `${formatBRL(ln.unitPriceCents).replace('R$ ', '')} cada`}</span>
                      </span>
                      <span style={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{formatBRL(ln.totalCents)}</span>
                      {ln.kind === 'unit' ? (
                        <QuantityStepper variant="compact" label={ln.name} value={ln.qty} min={0} max={Math.max(ln.qty, stock(ln.itemId))} onChange={(v) => setQty(ln.key, v)} />
                      ) : (
                        <IconButton label={`Remover ${ln.name}`} icon="remover" onClick={() => remove(ln.key)} />
                      )}
                    </div>
                  ))}
                </div>
                <ButtonLink href="/pdv/vender" variant="ghost">Adicionar produto</ButtonLink>
                <div className={l.linkList}>
                  <div className={s.plainRow} style={{ justifyContent: 'space-between' }}><span>Subtotal</span><span style={{ fontVariantNumeric: 'tabular-nums' }}>{formatBRL(priced.subtotalCents)}</span></div>
                  {discount && priced.discountCents > 0 && (
                    <div className={s.plainRow} style={{ justifyContent: 'space-between' }}><span>{discountLabel[discount.kind]}</span><span style={{ fontVariantNumeric: 'tabular-nums' }}>− {formatBRL(priced.discountCents)}</span></div>
                  )}
                  <div className={s.plainRow} style={{ justifyContent: 'space-between', fontWeight: 700 }}><span>Total</span><span style={{ fontVariantNumeric: 'tabular-nums' }}>{formatBRL(priced.totalCents)}</span></div>
                </div>
                <div className={s.filters}>
                  <Button variant="secondary" onClick={() => setOpen(true)}>Dar desconto</Button>
                  {discount && <Button variant="ghost" onClick={() => setDiscount(null)}>Tirar desconto</Button>}
                </div>
              </>
            )
          }
        </QueryBoundary>
      </main>
      {priced.lines.length > 0 && (
        <Footer>
          <ButtonLink href="/pdv/pagamento" size="lg" fullWidth>Cobrar {formatBRL(priced.totalCents)}</ButtonLink>
        </Footer>
      )}
      <BottomSheet open={open} onClose={() => setOpen(false)} title="Desconto">
        <div className={l.stack} style={{ gap: 12 }}>
          <div role="group" aria-label="Tipo de desconto" className={s.filters}>
            {discountKinds.map((d) => <Chip key={d.kind} selected={pick === d.kind} onClick={() => setPick(d.kind)}>{d.label}</Chip>)}
          </div>
          <div className={l.stack} style={{ gap: 6 }}>
            <label htmlFor="motivo" style={{ fontWeight: 600 }}>Motivo</label>
            <select id="motivo" value={reason} onChange={(e) => setReason(e.target.value)} style={{ height: 48, padding: '0 12px', borderRadius: 8, border: '1.5px solid var(--linha)', background: 'var(--superficie)', font: 'var(--corpo)', color: 'var(--texto)' }}>
              {discountReasons.map((r) => <option key={r}>{r}</option>)}
            </select>
          </div>
          <div role="status" className={l.sub}>{preview ? `Desconto de ${formatBRL(preview.cents)} · total fica ${formatBRL(priced.subtotalCents - preview.cents)}` : 'Esse desconto não muda o total.'}</div>
          <Button size="lg" fullWidth disabled={!preview} onClick={() => { if (preview) setDiscount({ kind: pick, reason }); setOpen(false) }}>Aplicar desconto</Button>
          <Button variant="ghost" fullWidth onClick={() => setOpen(false)}>Cancelar</Button>
        </div>
      </BottomSheet>
    </>
  )
}
