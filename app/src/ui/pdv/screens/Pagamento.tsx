import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { Button } from '@/components/Button'
import { Icon, type IconName } from '@/components/Icon'
import { formatCents } from '@/domain/money'
import { cartTotal, payLabels, type PayMethod } from '@/domain/pdv'
import { cartStore, completeSale } from '@/services/pdv'
import { Bar } from '../../shared/OpsBits'
import { BigChip } from '../components/PdvBits'
import o from '@/styles/ops.module.css'
import s from './Pdv.module.css'

const icons: Record<PayMethod, IconName> = { cash: 'caixa', pix: 'confirmar', debit: 'financeiro', credit: 'financeiro' }

/** Sugestões de valor recebido acima do total: próxima dezena, a seguinte e a nota redonda */
export function cashSuggestions(total: number) {
  const a = Math.ceil(total / 1000) * 1000
  const out = new Set<number>()
  if (a > total) out.add(a)
  out.add(a + 1000)
  out.add(Math.ceil((a + 1000) / 5000) * 5000)
  return [...out].filter((v) => v > total).sort((x, y) => x - y).slice(0, 3)
}

// H-P3 — dinheiro (com troco), Pix por QR com confirmação manual, débito e crédito na maquininha à parte
export function Pagamento() {
  const cart = cartStore.useStore()
  const navigate = useNavigate()
  const total = cartTotal(cart)
  const [method, setMethod] = useState<PayMethod>('cash')
  const [received, setReceived] = useState<number | null>(null)

  if (cart.lines.length === 0) return <Navigate to="/pdv" replace />

  const suggestions = cashSuggestions(total)
  const cashIn = received ?? total
  const change = cashIn - total
  const label =
    method === 'cash' ? `Recebi ${formatCents(cashIn)} · concluir` : method === 'pix' ? 'Pix recebido · concluir' : 'Cartão aprovado · concluir'

  const finish = () => {
    const sale = completeSale(cart, [{ method, cents: total, receivedCents: method === 'cash' ? cashIn : undefined }])
    navigate(`/pdv/concluida/${sale.id}`, { replace: true, state: { placed: true } })
  }

  return (
    <div className={o.screen}>
      <Bar title="Pagamento" back="/pdv/sacola" />
      <main className={`${o.main} ${o.mainTop} ${o.narrow}`}>
        <div className={s.panelBox}>
          <div>Total a cobrar</div>
          <div className={s.big}>{formatCents(total)}</div>
        </div>
        <div className={s.methods} role="group" aria-label="Forma de pagamento">
          {(Object.keys(payLabels) as PayMethod[]).map((m) => (
            <button key={m} type="button" className={s.method} aria-pressed={method === m} onClick={() => setMethod(m)}>
              <Icon name={icons[m]} size={22} />
              {payLabels[m]}
            </button>
          ))}
        </div>
        {method === 'cash' && (
          <>
            <div className={o.section}>
              <div id="recebido" className={o.bold}>
                Valor recebido
              </div>
              <div className={s.chipRow} role="group" aria-labelledby="recebido" style={{ flexWrap: 'wrap' }}>
                <BigChip active={received === null} onClick={() => setReceived(null)}>
                  Exato
                </BigChip>
                {suggestions.map((v) => (
                  <BigChip key={v} active={received === v} onClick={() => setReceived(v)}>
                    {formatCents(v)}
                  </BigChip>
                ))}
              </div>
            </div>
            <div className={s.change} aria-live="polite">
              <b>Troco a devolver</b>
              <span className={s.changeValue}>{formatCents(Math.max(0, change))}</span>
            </div>
          </>
        )}
        {method === 'pix' && (
          <div className={o.section}>
            <div role="img" aria-label="Espaço para o QR Code Pix" className={s.qr}>
              [QR CODE PIX]
            </div>
            <p className={o.muted}>Mostre o código ao cliente. Confirme aqui quando o Pix cair; a confirmação é manual nesta versão.</p>
          </div>
        )}
        {(method === 'debit' || method === 'credit') && (
          <div className={o.card} style={{ flexDirection: 'row', gap: 12, alignItems: 'flex-start' }}>
            <Icon name="financeiro" size={22} />
            <div>
              <b>Passe na maquininha</b>
              <div className={o.muted}>Digite {formatCents(total)} na maquininha e confirme aqui quando aprovar.</div>
            </div>
          </div>
        )}
        <Link to="/pdv/combinado" className={o.linkInline}>
          Dividir em mais de uma forma
          <Icon name="avancar" size={18} />
        </Link>
      </main>
      <div className={o.footer}>
        <Button size="l" block onClick={finish}>
          {label}
        </Button>
      </div>
    </div>
  )
}
