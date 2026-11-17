import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Tag } from '@/components/Badges'
import { Box } from '@/components/Card'
import { Button, ButtonLink } from '@/components/Button'
import { Banner, EmptyState } from '@/components/Feedback'
import { TextField } from '@/components/Field'
import { Sheet } from '@/components/Sheet'
import { hourMinute } from '@/domain/dates'
import { formatCents } from '@/domain/money'
import { payLabels, qtyText } from '@/domain/pdv'
import { cancelSale, salesStore } from '@/services/pdv'
import { discardQueued, flushQueue, posErrorMessage, retryQueued } from '@/services/pdvRemote'
import { Bar, SumRow } from '../../shared/OpsBits'
import o from '@/styles/ops.module.css'

export function Venda() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const sale = salesStore.useStore().find((x) => x.id === id)
  const [asking, setAsking] = useState(false)
  const [pin, setPin] = useState('')
  const [error, setError] = useState<string>()
  const [busy, setBusy] = useState(false)

  if (!sale) {
    return (
      <div className={o.screen}>
        <Bar title="Venda" back="/pdv/vendas" />
        <EmptyState bare icon="historico" title="Venda não encontrada" action={<ButtonLink to="/pdv/vendas">Ver vendas</ButtonLink>} />
      </div>
    )
  }

  const cancelled = sale.status === 'cancelled'
  const first = sale.payments[0]

  // H-P6 — cancelar exige senha de gestor. A conferência real da senha fica no servidor (Supabase);
  // aqui só se exige uma senha numérica de 4 dígitos para o fluxo ficar completo.
  const confirm = async () => {
    if (!/^\d{4,}$/.test(pin)) return setError('Digite a senha numérica do gestor (4 números ou mais).')
    setBusy(true)
    try {
      await cancelSale(sale.id, pin)
      setAsking(false)
      setPin('')
      setError(undefined)
    } catch (e) {
      setError(posErrorMessage(e))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className={o.screen}>
      <Bar title={`Venda ${sale.number}`} back="/pdv/vendas" />
      <main className={`${o.main} ${o.mainTop} ${o.narrow}`}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {cancelled ? <Tag tone="error">Cancelada</Tag> : <Tag tone="success">Concluída</Tag>}
          <span className={`${o.muted} ${o.num}`}>
            Hoje, {hourMinute(sale.at)} · {sale.by}
          </span>
        </div>
        <Box>
          {sale.lines.map((l) => (
            <div key={l.itemId} className={`${o.cardHead} ${o.num}`} style={{ padding: '12px 0', borderBottom: '1px solid var(--linha)', alignItems: 'flex-start' }}>
              <span>
                {qtyText(l).replace(' un', '')} × {l.name}
                <span className={o.small} style={{ display: 'block' }}>
                  {l.lotCode ? `lote ${l.lotCode}` : l.grams !== null ? `${formatCents(l.unitPriceCents)}/kg` : 'sem lote'}
                </span>
              </span>
              <span>{formatCents(l.totalCents)}</span>
            </div>
          ))}
          {sale.discountCents > 0 && (
            <div className={`${o.cardHead} ${o.num}`} style={{ padding: '12px 0', borderBottom: '1px solid var(--linha)' }}>
              <span>
                {sale.discountLabel}
                <span className={o.small} style={{ display: 'block' }}>
                  {sale.discountReason}
                </span>
              </span>
              <span>− {formatCents(sale.discountCents)}</span>
            </div>
          )}
          <div className={`${o.cardHead} ${o.num}`} style={{ padding: '12px 0', fontWeight: 600 }}>
            <span>Total</span>
            <span>{formatCents(sale.totalCents)}</span>
          </div>
        </Box>
        <div className={o.card}>
          {sale.payments.map((p, i) => (
            <SumRow key={i} label={i === 0 ? 'Pagamento' : ''} value={`${payLabels[p.method]} · ${formatCents(p.cents)}`} />
          ))}
        </div>
        {cancelled && (
          <Banner tone="info">
            {`Cancelada às ${hourMinute(sale.cancelledAt!)} por ${sale.cancelledBy}. Os itens voltaram ao estoque. Devolva ${formatCents(sale.totalCents)} ${first.method === 'cash' ? 'em dinheiro' : first.method === 'pix' ? 'por Pix' : 'no cartão, pela maquininha,'} ao cliente.`}
          </Banner>
        )}
      </main>
      <div className={o.footer}>
        {sale.pending && (
          <>
            <Banner tone={sale.pending === 'failed' ? 'error' : 'warning'}>
              {sale.pending === 'failed' ? `O servidor não aceitou esta venda: ${sale.pendingError}` : 'Esta venda ainda não chegou ao servidor. Ela é enviada sozinha quando a conexão voltar.'}
            </Banner>
            <Button size="l" block onClick={() => void (sale.pending === 'failed' ? retryQueued(sale.id) : flushQueue())}>
              {sale.pending === 'failed' ? 'Tentar enviar de novo' : 'Enviar agora'}
            </Button>
            {sale.pending === 'failed' && (
              <Button
                variant="danger"
                block
                onClick={() => {
                  discardQueued(sale.id)
                  navigate('/pdv/vendas', { replace: true })
                }}
              >
                Descartar esta venda
              </Button>
            )}
          </>
        )}
        {!cancelled && !sale.pending && (
          <Button variant="danger" size="l" block onClick={() => setAsking(true)}>
            Cancelar venda
          </Button>
        )}
        <ButtonLink to="/pdv/vendas" variant="secondary" block>
          Voltar às vendas
        </ButtonLink>
      </div>

      <Sheet open={asking} onClose={() => setAsking(false)} title={`Cancelar a venda ${sale.number}?`} variant="modal">
        <p className={o.muted}>Os itens voltam ao estoque. Cancelamento precisa da senha de um gestor.</p>
        <TextField label="Senha do gestor" type="password" inputMode="numeric" autoComplete="off" placeholder="••••" value={pin} error={error} onChange={(e) => { setPin(e.target.value); setError(undefined) }} />
        <Button variant="danger" size="l" block disabled={busy} onClick={() => void confirm()}>
          Cancelar venda
        </Button>
        <Button variant="secondary" block onClick={() => setAsking(false)}>
          Voltar
        </Button>
      </Sheet>
    </div>
  )
}
