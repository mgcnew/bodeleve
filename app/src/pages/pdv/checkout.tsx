import { useMemo, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { Banner, Button, ButtonLink, Chip, EmptyState, Icon, IndicatorSkeleton, ListSkeleton, PaymentMethods, TextField } from '@/components'
import { hhmm } from '@/domain/deliveries'
import { addPart, cashSuggestions, changeOf, cashReceivedOf, missingOf, payLabel, payMethods, PosError, singlePayment, type PayMethod, type Payment } from '@/domain/pos'
import { formatKgShort } from '@/domain/units'
import { formatBRL, parseMoney } from '@/lib/format'
import { useServices } from '@/services'
import type { CheckoutInput } from '@/services/types'
import { useAdminSession } from '@/store/admin'
import { usePosCart } from '@/store/pos'
import { priceCart } from '@/ui/pdv/cart'
import { useInvalidatePos, useOnline, usePosCatalog, usePosSale } from '@/ui/pdv/queries'
import { Footer, QueryBoundary, ScreenHeader } from '@/ui/loja/parts'
import s from '@/ui/gestao/gestao.module.css'
import l from '@/ui/loja/loja.module.css'

const methods = payMethods.map((m) => ({ value: m, label: payLabel[m] }))

function errorText(e: unknown): string {
  const code = e instanceof PosError ? e.code : (e as Error).message
  if (code === 'insufficient_stock') return 'Falta estoque de um item da sacola. Volte à sacola e ajuste a quantidade.'
  if (code === 'no_session') return 'O caixa está fechado. Abra o caixa para vender.'
  if (code === 'invalid_payment') return 'O pagamento não fecha com o total. Confira os valores.'
  return 'Não foi possível concluir a venda. Nada foi cobrado. Tente de novo.'
}

/** Conclui a venda e leva para a tela final. Sem conexão a venda fica guardada neste aparelho (H-I89). */
function useFinish() {
  const { admin } = useServices()
  const user = useAdminSession((x) => x.user)
  const clear = usePosCart((x) => x.clear)
  const invalidate = useInvalidatePos()
  const navigate = useNavigate()
  const online = useOnline()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const finish = async (input: Omit<CheckoutInput, 'offline'>) => {
    setBusy(true)
    setError(null)
    try {
      const sale = await admin.pos.checkout({ ...input, offline: !online }, user?.name ?? 'Balcão')
      clear()
      await invalidate()
      navigate(`/pdv/concluida/${sale.id}`, { replace: true })
    } catch (e) {
      setError(errorText(e))
      setBusy(false)
    }
  }
  return { finish, busy, error }
}

function useBag() {
  const catalog = usePosCatalog()
  const { lines, discount } = usePosCart()
  const priced = useMemo(() => priceCart(lines, catalog.data?.products ?? [], discount), [lines, catalog.data, discount])
  return { catalog, priced, discount }
}

export function PaymentPage() {
  const { catalog, priced, discount } = useBag()
  const { finish, busy, error } = useFinish()
  const [method, setMethod] = useState<PayMethod>('cash')
  const [pick, setPick] = useState<number | null>(null)
  const [other, setOther] = useState('')

  if (catalog.isPending) return <IndicatorSkeleton label="Carregando o pagamento" />
  if (priced.lines.length === 0) return <Navigate to="/pdv/vender" replace />
  const total = priced.totalCents
  const otherCents = other.trim() ? parseMoney(other) : null
  const received = otherCents ?? pick ?? total
  const tooLow = method === 'cash' && received < total
  const suggestions = cashSuggestions(total)

  const confirm = () => {
    const payments = singlePayment(method, total, method === 'cash' ? received : undefined)
    return finish({ lines: usePosCart.getState().lines, discount, payments })
  }
  const label = method === 'cash' ? `Recebi ${formatBRL(received)} · concluir` : method === 'pix' ? 'Pix recebido · concluir' : 'Cartão aprovado · concluir'

  return (
    <>
      <ScreenHeader title="Pagamento" back="/pdv/sacola" />
      <main className={s.main} style={{ gap: 16, paddingTop: 16 }}>
        <div className={l.stack} style={{ gap: 2 }}>
          <div className={l.sub}>Total a cobrar</div>
          <div style={{ font: '700 34px/40px var(--fonte-titulo)', fontVariantNumeric: 'tabular-nums' }}>{formatBRL(total)}</div>
        </div>
        <PaymentMethods methods={methods} value={method} onChange={(m) => { setMethod(m); setPick(null); setOther('') }} />
        {method === 'cash' && (
          <section aria-label="Dinheiro" className={l.stack} style={{ gap: 12 }}>
            <b>Quanto o cliente entregou?</b>
            <div role="group" aria-label="Valor entregue" className={s.filters}>
              <Chip selected={otherCents == null && pick == null} onClick={() => { setPick(null); setOther('') }}>Exato</Chip>
              {suggestions.map((v) => <Chip key={v} selected={otherCents == null && pick === v} onClick={() => { setPick(v); setOther('') }}>{formatBRL(v)}</Chip>)}
            </div>
            <TextField label="Outro valor" inputMode="decimal" placeholder="R$ 0,00" value={other} onChange={(e) => setOther(e.target.value)} error={tooLow ? 'O valor entregue é menor que o total.' : undefined} />
            <div className={s.plainRow} style={{ justifyContent: 'space-between', fontWeight: 700 }}><span>Troco</span><span role="status" style={{ fontVariantNumeric: 'tabular-nums' }}>{formatBRL(Math.max(0, received - total))}</span></div>
          </section>
        )}
        {method === 'pix' && (
          <section aria-label="Pix" className={l.stack} style={{ gap: 8, alignItems: 'center', textAlign: 'center' }}>
            <div className={l.sub} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 180, height: 180, borderRadius: 12, border: '1.5px dashed var(--linha)' }}>[QR CODE PIX]</div>
            <div className={l.sub}>Mostre o QR ao cliente. Confirme quando o Pix aparecer na conta.</div>
          </section>
        )}
        {(method === 'debit' || method === 'credit') && (
          <section aria-label="Cartão" className={l.stack} style={{ gap: 8, alignItems: 'center', textAlign: 'center' }}>
            <Icon name="caixa" size={32} />
            <b>Passe na maquininha</b>
            <div className={l.sub}>Digite {formatBRL(total)} na maquininha e confirme aqui quando aprovar.</div>
          </section>
        )}
        <ButtonLink href="/pdv/pagamento/dividir" variant="ghost">Dividir em duas formas</ButtonLink>
        {error && <Banner tone="error">{error}</Banner>}
      </main>
      <Footer>
        <Button size="lg" fullWidth loading={busy} disabled={tooLow} onClick={confirm}>{label}</Button>
      </Footer>
    </>
  )
}

export function SplitPage() {
  const { catalog, priced, discount } = useBag()
  const { finish, busy, error } = useFinish()
  const [parts, setParts] = useState<Payment[]>([])
  const [method, setMethod] = useState<PayMethod>('pix')
  const [text, setText] = useState('')
  const [fieldError, setFieldError] = useState<string | undefined>()

  if (catalog.isPending) return <IndicatorSkeleton label="Carregando o pagamento" />
  if (priced.lines.length === 0) return <Navigate to="/pdv/vender" replace />
  const total = priced.totalCents
  const missing = missingOf(total, parts)
  const value = text.trim() ? parseMoney(text) : missing

  const receive = () => {
    if (value == null || value <= 0) return setFieldError('Informe o valor desta parte, por exemplo R$ 50,00.')
    try {
      setParts(addPart(parts, method, value, total))
      setText('')
      setFieldError(undefined)
    } catch {
      setFieldError('Informe um valor maior que zero.')
    }
  }

  return (
    <>
      <ScreenHeader title="Dividir pagamento" back="/pdv/pagamento" />
      <main className={s.main} style={{ gap: 16, paddingTop: 16 }}>
        <div className={l.linkList}>
          <div className={s.plainRow} style={{ justifyContent: 'space-between' }}><span>Total</span><b style={{ fontVariantNumeric: 'tabular-nums' }}>{formatBRL(total)}</b></div>
          <div className={s.plainRow} style={{ justifyContent: 'space-between' }}><span>Falta receber</span><b role="status" style={{ fontVariantNumeric: 'tabular-nums' }}>{formatBRL(missing)}</b></div>
        </div>
        <section aria-label="Já recebido" className={l.stack} style={{ gap: 8 }}>
          <b>Já recebido</b>
          {parts.length === 0 ? <div className={l.sub}>Nada ainda</div> : (
            <div className={l.linkList}>
              {parts.map((p, i) => <div key={i} className={s.plainRow} style={{ justifyContent: 'space-between' }}><span>{payLabel[p.method]}</span><b style={{ fontVariantNumeric: 'tabular-nums' }}>{formatBRL(p.cents)}</b></div>)}
            </div>
          )}
        </section>
        {missing > 0 && (
          <section aria-label="Próxima parte" className={l.stack} style={{ gap: 12 }}>
            <b>Próxima parte</b>
            <PaymentMethods methods={methods} value={method} onChange={setMethod} label="Forma desta parte" />
            <TextField label="Valor" inputMode="decimal" placeholder={formatBRL(missing)} value={text} onChange={(e) => setText(e.target.value)} error={fieldError} />
            <Button variant="secondary" onClick={receive}>Receber esta parte</Button>
          </section>
        )}
        {error && <Banner tone="error">{error}</Banner>}
      </main>
      <Footer>
        {missing === 0 ? (
          <Button size="lg" fullWidth loading={busy} onClick={() => finish({ lines: usePosCart.getState().lines, discount, payments: parts })}>Concluir venda</Button>
        ) : (
          <Button size="lg" fullWidth disabled>Falta {formatBRL(missing)}</Button>
        )}
        <Button variant="ghost" fullWidth onClick={() => { setParts([]); setText(''); setFieldError(undefined) }}>Recomeçar</Button>
      </Footer>
    </>
  )
}

export function DonePage() {
  const { id } = useParams()
  const { admin } = useServices()
  const query = usePosSale(id)
  const [phone, setPhone] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | undefined>()
  const send = async () => {
    if (phone.replace(/\D/g, '').length < 10) return setError('Use o DDD e o número, por exemplo (00) 90000-0000.')
    try {
      await admin.pos.sendReceipt(id!, phone)
      setSent(true)
      setError(undefined)
    } catch {
      setError('Não foi possível registrar o comprovante. Tente de novo.')
    }
  }
  return (
    <>
      <main className={s.main} style={{ gap: 16, paddingTop: 32 }}>
        <QueryBoundary query={query} skeleton={<ListSkeleton rows={3} label="Carregando a venda" />} errorTitle="Não foi possível carregar a venda">
          {(sale) =>
            !sale ? (
              <EmptyState icon="alerta" title="Venda não encontrada" action={<ButtonLink href="/pdv/vender">Nova venda</ButtonLink>} />
            ) : (
              <>
                <div className={l.stack} style={{ alignItems: 'center', gap: 8, textAlign: 'center' }}>
                  <div className={s.disc} style={{ width: 64, height: 64, background: 'var(--sucesso-fundo)', color: 'var(--sucesso)' }} aria-hidden="true"><Icon name="confirmar" size={32} /></div>
                  <h1 className={l.h1}>Venda concluída</h1>
                  <div className={l.sub}>{sale.id} · {hhmm(sale.at)} · {formatBRL(sale.totalCents)}</div>
                </div>
                {sale.pending && <Banner tone="warning" icon="sem-conexao">Venda guardada neste aparelho. Será enviada quando a conexão voltar.</Banner>}
                {changeOf(sale.payments) > 0 && (
                  <div className={l.linkList}>
                    <div className={s.plainRow} style={{ justifyContent: 'space-between', fontWeight: 700 }}><span>Troco a devolver</span><span>{formatBRL(changeOf(sale.payments))}</span></div>
                    <div className={s.plainRow} style={{ justifyContent: 'space-between' }}><span>Dinheiro recebido</span><span>{formatBRL(cashReceivedOf(sale.payments))}</span></div>
                  </div>
                )}
                <div className={l.stack} style={{ gap: 2 }}>
                  <b>Saiu do estoque</b>
                  <div className={l.sub}>{sale.lines.map((ln) => (ln.kind === 'weight' ? `${formatKgShort(ln.qty)} ${ln.name}` : `${ln.qty} ${ln.name}`)).join(', ')}</div>
                </div>
                {sent ? (
                  <div role="status"><Banner tone="success">Comprovante registrado. O envio por WhatsApp ainda não está ligado nesta versão.</Banner></div>
                ) : (
                  <div className={l.stack} style={{ gap: 8 }}>
                    <TextField label="Comprovante por WhatsApp (opcional)" type="tel" placeholder="(00) 90000-0000" value={phone} onChange={(e) => setPhone(e.target.value)} error={error} />
                    <Button variant="secondary" onClick={send}>Enviar</Button>
                  </div>
                )}
              </>
            )
          }
        </QueryBoundary>
      </main>
      <Footer>
        <ButtonLink href="/pdv/vender" size="lg" fullWidth>Nova venda</ButtonLink>
      </Footer>
    </>
  )
}
