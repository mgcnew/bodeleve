import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { AppLink, Banner, BottomSheet, Button, ButtonLink, CashClosing, Chip, EmptyState, Icon, IndicatorSkeleton, ListSkeleton, Modal, StatusTag, TextField } from '@/components'
import { hhmm } from '@/domain/deliveries'
import { movementValues, payLabel, PosError, refundText, sangriaReasons, suprimentoReasons } from '@/domain/pos'
import { formatKg } from '@/domain/units'
import { formatBRL, parseMoney } from '@/lib/format'
import { useServices } from '@/services'
import { useAdminSession } from '@/store/admin'
import { useInvalidatePos, usePosCash, usePosSale, usePosSales } from '@/ui/pdv/queries'
import { Footer, QueryBoundary, ScreenHeader } from '@/ui/loja/parts'
import s from '@/ui/gestao/gestao.module.css'
import l from '@/ui/loja/loja.module.css'

const h2 = { font: '700 17px/24px var(--fonte-titulo)', margin: 0 } as const
const num = { fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' } as const
const selectStyle = { height: 48, padding: '0 12px', borderRadius: 8, border: '1.5px solid var(--linha)', background: 'var(--superficie)', font: 'var(--corpo)', color: 'var(--texto)', width: '100%' } as const

const filters = [
  { key: 'all', label: 'Todas' },
  { key: 'cash', label: 'Dinheiro' },
  { key: 'pix', label: 'Pix' },
  { key: 'card', label: 'Cartão' },
] as const

export function SalesPage() {
  const [filter, setFilter] = useState<'all' | 'cash' | 'pix' | 'card'>('all')
  const query = usePosSales(filter)
  return (
    <main className={s.main} style={{ gap: 16, paddingTop: 8 }}>
      <QueryBoundary query={query} skeleton={<ListSkeleton rows={5} label="Carregando as vendas" />} errorTitle="Não foi possível carregar as vendas">
        {(d) => (
          <>
            <div className={l.stack} style={{ gap: 2 }}>
              <h2 style={h2}>Vendas de hoje</h2>
              <div className={l.sub}>{d.count} {d.count === 1 ? 'venda' : 'vendas'} · {formatBRL(d.totalCents)} no balcão</div>
            </div>
            <div role="group" aria-label="Forma de pagamento" className={s.filters}>
              {filters.map((f) => <Chip key={f.key} selected={filter === f.key} onClick={() => setFilter(f.key)}>{f.label}</Chip>)}
            </div>
            {d.rows.length === 0 ? (
              <EmptyState icon="historico" title="Nenhuma venda aqui" description={d.session ? 'As vendas aparecem conforme são concluídas.' : 'Abra o caixa para vender.'} />
            ) : (
              <div className={l.linkList}>
                {d.rows.map((r) => (
                  <AppLink key={r.id} href={`/pdv/vendas/${r.id}`} className={l.linkRow} style={{ minHeight: 64 }}>
                    <span className={l.grow}>
                      <span className={l.optionTitle}>{r.id} · {hhmm(r.at)}</span>
                      <span className={l.optionDetail}>{r.items} {r.items === 1 ? 'item' : 'itens'} · {r.methods}</span>
                    </span>
                    <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                      <span style={{ fontWeight: 600, ...num, textDecoration: r.cancelled ? 'line-through' : undefined }}>{formatBRL(r.totalCents)}</span>
                      {r.cancelled && <StatusTag tone="error">Cancelada</StatusTag>}
                      {!r.cancelled && r.pending && <StatusTag tone="warning">Não enviada</StatusTag>}
                    </span>
                    <Icon name="avancar" size={18} />
                  </AppLink>
                ))}
              </div>
            )}
            <div className={l.sub}>Mostrando as 6 mais recentes. Vendas da loja online ficam em Pedidos, na gestão.</div>
          </>
        )}
      </QueryBoundary>
    </main>
  )
}

export function SalePage() {
  const { id } = useParams()
  const { admin } = useServices()
  const invalidate = useInvalidatePos()
  const query = usePosSale(id)
  const [modal, setModal] = useState(false)
  const [pin, setPin] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const cancel = async () => {
    setBusy(true)
    setError(null)
    try {
      await admin.pos.cancelSale(id!, pin)
      await invalidate()
      setModal(false)
      setPin('')
    } catch (e) {
      setError(e instanceof PosError && e.code === 'invalid_pin' ? 'Senha incorreta. Confira com o gestor.' : 'Não foi possível cancelar. Nada foi alterado. Tente de novo.')
    }
    setBusy(false)
  }

  return (
    <>
      <ScreenHeader title={`Venda ${id}`} back="/pdv/vendas" />
      <main className={s.main} style={{ gap: 16, paddingTop: 16 }}>
        <QueryBoundary query={query} skeleton={<IndicatorSkeleton label="Carregando a venda" />} errorTitle="Não foi possível carregar a venda">
          {(sale) =>
            !sale ? (
              <EmptyState icon="alerta" title="Venda não encontrada" action={<ButtonLink href="/pdv/vendas">Ver vendas</ButtonLink>} />
            ) : (
              <>
                <div className={l.stack} style={{ gap: 6 }}>
                  <div><StatusTag tone={sale.status === 'cancelled' ? 'error' : 'success'}>{sale.status === 'cancelled' ? 'Cancelada' : 'Concluída'}</StatusTag></div>
                  <div className={l.sub}>{new Date(sale.at).toDateString() === new Date().toDateString() ? 'Hoje' : new Date(sale.at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}, {hhmm(sale.at)} · {sale.by}</div>
                </div>
                <div className={l.linkList}>
                  {sale.lines.map((ln, i) => (
                    <div key={i} className={s.plainRow} style={{ minHeight: 64 }}>
                      <span className={l.grow}>
                        <span className={l.optionTitle}>{ln.kind === 'weight' ? `${formatKg(ln.qty)} × ${ln.name}` : `${ln.qty} × ${ln.name}`}</span>
                        <span className={l.optionDetail}>{ln.kind === 'weight' ? `${formatBRL(ln.unitPriceCents)}/kg` : ln.lots.length ? `lote ${ln.lots.map((x) => x.lotCode).join(', ')}` : ''}</span>
                      </span>
                      <span style={{ fontWeight: 600, ...num }}>{formatBRL(ln.totalCents)}</span>
                    </div>
                  ))}
                </div>
                <div className={l.linkList}>
                  {sale.discount && <div className={s.plainRow} style={{ justifyContent: 'space-between' }}><span>Desconto · {sale.discount.reason}</span><span style={num}>− {formatBRL(sale.discount.cents)}</span></div>}
                  <div className={s.plainRow} style={{ justifyContent: 'space-between', fontWeight: 700 }}><span>Total</span><span style={num}>{formatBRL(sale.totalCents)}</span></div>
                </div>
                <section aria-label="Pagamento" className={l.stack} style={{ gap: 4 }}>
                  <h2 style={h2}>Pagamento</h2>
                  {sale.payments.map((p, i) => (
                    <div key={i}>
                      {payLabel[p.method]}{p.method === 'cash' ? (p.receivedCents ? ` · recebido ${formatBRL(p.receivedCents)}${p.receivedCents > p.cents ? ` · troco ${formatBRL(p.receivedCents - p.cents)}` : ''}` : '') : p.method === 'pix' ? ` · confirmado ${hhmm(sale.at)}` : ` · aprovado ${hhmm(sale.at)}`}
                      {sale.payments.length > 1 ? ` · ${formatBRL(p.cents)}` : ''}
                    </div>
                  ))}
                </section>
                {sale.status === 'cancelled' && sale.cancel && (
                  <Banner tone="warning">Cancelada às {hhmm(sale.cancel.at)}. Aprovado por {sale.cancel.approvedBy}. Os itens voltaram ao estoque. {refundText(sale, formatBRL)}</Banner>
                )}
                {sale.pending && <Banner tone="warning" icon="sem-conexao">Venda guardada neste aparelho. Será enviada quando a conexão voltar.</Banner>}
              </>
            )
          }
        </QueryBoundary>
      </main>
      <Footer>
        {query.data?.status === 'completed' && <Button variant="destructive" size="lg" fullWidth onClick={() => setModal(true)}>Cancelar venda</Button>}
        <ButtonLink href="/pdv/vendas" variant="secondary" size="lg" fullWidth>Voltar às vendas</ButtonLink>
      </Footer>
      <Modal open={modal} title={`Cancelar a venda ${id}?`} description="Os itens voltam ao estoque. Cancelamento precisa da senha de um gestor." onCancel={() => { setModal(false); setError(null) }}>
        <TextField label="Senha do gestor" type="password" inputMode="numeric" autoComplete="off" placeholder="••••" value={pin} onChange={(e) => setPin(e.target.value)} error={error ?? undefined} />
        <Button variant="destructive" fullWidth loading={busy} onClick={cancel}>Cancelar venda</Button>
        <Button variant="secondary" fullWidth onClick={() => { setModal(false); setError(null) }}>Voltar</Button>
      </Modal>
    </>
  )
}

export function CashPage() {
  const { admin } = useServices()
  const user = useAdminSession((x) => x.user)
  const invalidate = useInvalidatePos()
  const query = usePosCash()
  const [sheet, setSheet] = useState(false)
  const [kind, setKind] = useState<'sangria' | 'suprimento'>('sangria')
  const [value, setValue] = useState(10000)
  const [reason, setReason] = useState(sangriaReasons[0])
  const [counted, setCounted] = useState<string | null>(null)
  const [confirm, setConfirm] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const run = async (f: () => Promise<unknown>, fail: string) => {
    setBusy(true)
    setError(null)
    try {
      await f()
      await invalidate()
    } catch (e) {
      setError(e instanceof PosError && e.code === 'invalid_amount' ? 'A gaveta não tem esse valor. Escolha um valor menor.' : fail)
    }
    setBusy(false)
  }

  return (
    <main className={s.main} style={{ gap: 16, paddingTop: 8 }}>
      <QueryBoundary query={query} skeleton={<ListSkeleton rows={5} label="Carregando o caixa" />} errorTitle="Não foi possível carregar o caixa">
        {(c) => {
          if (!c) return <EmptyState icon="caixa" title="Nenhum caixa aberto" description="Abra o caixa para começar a vender." action={<ButtonLink href="/pdv/abertura">Abrir caixa</ButtonLink>} />
          if (c.session.status === 'closed') {
            const d = c.differenceCents ?? 0
            return (
              <div className={l.stack} style={{ alignItems: 'center', gap: 12, textAlign: 'center', paddingTop: 16 }}>
                <div className={s.disc} style={{ width: 64, height: 64, background: 'var(--sucesso-fundo)', color: 'var(--sucesso)' }} aria-hidden="true"><Icon name="confirmar" size={32} /></div>
                <h1 className={l.h1}>Caixa fechado</h1>
                <div className={l.sub}>Esperado {formatBRL(c.expectedCents)} · contado {formatBRL(c.countedCents ?? 0)} · diferença {d === 0 ? 'zero' : `${d > 0 ? 'sobra de' : 'falta de'} ${formatBRL(Math.abs(d))}`}. O gestor vê o fechamento no financeiro.</div>
                {error && <Banner tone="error">{error}</Banner>}
                <ButtonLink href="/pdv/abertura" size="lg" fullWidth>Abrir novo caixa</ButtonLink>
                <Button variant="ghost" fullWidth loading={busy} onClick={() => run(() => admin.pos.reopenSession(), 'Não foi possível reabrir o caixa. Tente de novo.')}>Reabrir (corrigir)</Button>
              </div>
            )
          }
          const countedCents = counted == null ? c.expectedCents : parseMoney(counted)
          return (
            <>
              <section aria-label="Caixa de hoje" className={l.stack} style={{ gap: 8 }}>
                <h2 style={h2}>Caixa de hoje</h2>
                <b>Vendas no balcão · {c.count}</b>
                <div className={l.linkList}>
                  {([['Dinheiro', c.cashCents], ['Pix', c.pixCents], ['Cartão', c.cardCents]] as const).map(([k, v]) => <div key={k} className={s.plainRow} style={{ justifyContent: 'space-between' }}><span>{k}</span><span style={num}>{formatBRL(v)}</span></div>)}
                  <div className={s.plainRow} style={{ justifyContent: 'space-between', fontWeight: 700 }}><span>Total</span><span style={num}>{formatBRL(c.totalCents)}</span></div>
                </div>
              </section>
              <section aria-label="Dinheiro na gaveta" className={l.stack} style={{ gap: 8 }}>
                <h2 style={h2}>Dinheiro na gaveta</h2>
                <div className={l.linkList}>
                  <div className={s.plainRow} style={{ justifyContent: 'space-between' }}><span>Abertura (troco)</span><span style={num}>{formatBRL(c.session.openingCents)}</span></div>
                  <div className={s.plainRow} style={{ justifyContent: 'space-between' }}><span>Vendas em dinheiro</span><span style={num}>+ {formatBRL(c.salesCashCents)}</span></div>
                  {c.movements.map((m) => <div key={m.id} className={s.plainRow} style={{ justifyContent: 'space-between' }}><span>{m.label}</span><span style={num}>{m.signedCents < 0 ? '−' : '+'} {formatBRL(Math.abs(m.signedCents))}</span></div>)}
                  <div className={s.plainRow} style={{ justifyContent: 'space-between', fontWeight: 700 }}><span>Esperado</span><span style={num}>{formatBRL(c.expectedCents)}</span></div>
                </div>
                <Button variant="secondary" onClick={() => { setKind('sangria'); setReason(sangriaReasons[0]); setError(null); setSheet(true) }}>Sangria ou suprimento</Button>
              </section>
              <section aria-label="Fechar caixa" className={l.stack} style={{ gap: 12 }}>
                <h2 style={h2}>Fechar caixa</h2>
                <TextField label="Contado na gaveta" inputMode="decimal" hint="Conte as notas e moedas." value={counted ?? formatBRL(c.expectedCents)} onChange={(e) => setCounted(e.target.value)} error={countedCents == null ? 'Informe o valor contado, por exemplo R$ 412,00.' : undefined} />
                {countedCents != null && <CashClosing expectedCents={c.expectedCents} countedCents={countedCents} />}
                {error && <Banner tone="error">{error}</Banner>}
                <Button size="lg" fullWidth disabled={countedCents == null} onClick={() => setConfirm(true)}>Fechar caixa</Button>
              </section>
              <BottomSheet open={sheet} onClose={() => setSheet(false)} title="Movimentar dinheiro">
                <div className={l.stack} style={{ gap: 12 }}>
                  <div role="group" aria-label="Tipo" className={s.filters}>
                    <Chip selected={kind === 'sangria'} onClick={() => { setKind('sangria'); setReason(sangriaReasons[0]) }}>Retirar (sangria)</Chip>
                    <Chip selected={kind === 'suprimento'} onClick={() => { setKind('suprimento'); setReason(suprimentoReasons[0]) }}>Colocar (suprimento)</Chip>
                  </div>
                  <div role="group" aria-label="Valor" className={s.filters}>
                    {movementValues.map((v) => <Chip key={v} selected={value === v} onClick={() => setValue(v)}>R$ {v / 100}</Chip>)}
                  </div>
                  <div className={l.stack} style={{ gap: 6 }}>
                    <label htmlFor="mov-motivo" style={{ fontWeight: 600 }}>Motivo</label>
                    <select id="mov-motivo" value={reason} onChange={(e) => setReason(e.target.value)} style={selectStyle}>
                      {(kind === 'sangria' ? sangriaReasons : suprimentoReasons).map((r) => <option key={r}>{r}</option>)}
                    </select>
                  </div>
                  {error && <div role="alert" className={l.sub} style={{ color: 'var(--erro)' }}>{error}</div>}
                  <Button size="lg" fullWidth loading={busy} onClick={async () => { await run(() => admin.pos.addMovement(kind, value, reason, user?.name ?? 'Balcão'), 'Não foi possível registrar. Tente de novo.').then(() => undefined); setSheet(false) }}>Registrar</Button>
                  <Button variant="ghost" fullWidth onClick={() => setSheet(false)}>Cancelar</Button>
                </div>
              </BottomSheet>
              <Modal open={confirm} title="Fechar o caixa?" description={`Você contou ${formatBRL(countedCents ?? 0)}. Depois de fechar, as vendas do balcão param até abrir um novo caixa.`} onCancel={() => setConfirm(false)}>
                <Button size="lg" fullWidth loading={busy} onClick={async () => { await run(() => admin.pos.closeSession(countedCents!, user?.name ?? 'Balcão'), 'Não foi possível fechar o caixa. Tente de novo.'); setConfirm(false); setCounted(null) }}>Fechar caixa</Button>
                <Button variant="secondary" fullWidth onClick={() => setConfirm(false)}>Voltar</Button>
              </Modal>
            </>
          )
        }}
      </QueryBoundary>
    </main>
  )
}
