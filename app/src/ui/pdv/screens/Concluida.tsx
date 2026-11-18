import { useEffect, useState } from 'react'
import { useLocation, useParams } from 'react-router-dom'
import { ButtonLink } from '@/components/Button'
import { Banner, EmptyState } from '@/components/Feedback'
import { TextField } from '@/components/Field'
import { Icon } from '@/components/Icon'
import { hourMinute } from '@/domain/dates'
import { formatCents } from '@/domain/money'
import { formatPhone } from '@/domain/order'
import { payLabels, qtyText } from '@/domain/pdv'
import { whatsappLink } from '@/services/gestao/purchases'
import { cartStore, salesStore } from '@/services/pdv'
import { SumRow } from '../../shared/OpsBits'
import o from '@/styles/ops.module.css'
import s from './Pdv.module.css'
import e from '../../gestao/screens/estoque/Estoque.module.css'

export function Concluida() {
  const { id = '' } = useParams()
  const sale = salesStore.useStore().find((x) => x.id === id)
  const [phone, setPhone] = useState('')
  const placed = (useLocation().state as { placed?: boolean } | null)?.placed

  useEffect(() => {
    if (placed) cartStore.reset()
  }, [placed])

  if (!sale) return <EmptyState bare icon="caixa" title="Venda não encontrada" action={<ButtonLink to="/pdv">Nova venda</ButtonLink>} />

  const cash = sale.payments.find((p) => p.method === 'cash')
  const text = [`Obrigado pela compra na Bodeleve! Venda ${sale.number} · ${formatCents(sale.totalCents)}`, ...sale.lines.map((l) => `• ${qtyText(l)} ${l.name} — ${formatCents(l.totalCents)}`)].join('\n')
  const digits = phone.replace(/\D/g, '')

  return (
    <div className={o.screen}>
      <main className={`${o.main} ${o.narrow}`} style={{ paddingTop: 40 }}>
        <div className={e.done} style={{ padding: '0 0 8px' }}>
          <div aria-hidden="true" className={e.doneIcon}>
            <Icon name="confirmar" size={32} />
          </div>
          <h1 className={o.h1}>Venda concluída</h1>
          <p className={`${o.secondary} ${o.num}`}>
            {sale.number} · {hourMinute(sale.at)} · {formatCents(sale.totalCents)}
          </p>
        </div>
        {sale.pending && <Banner tone="warning">Sem internet: a venda ficou guardada neste aparelho e é enviada sozinha quando a conexão voltar. Pode seguir vendendo.</Banner>}
        {sale.changeCents > 0 && (
          <div className={s.change}>
            <b>Troco a devolver</b>
            <span className={s.changeValue}>{formatCents(sale.changeCents)}</span>
          </div>
        )}
        <div className={o.card}>
          {sale.customerName && <SumRow label="Cliente" value={sale.customerName} />}
          {sale.payments.map((p, i) => (
            <SumRow key={i} label={p.method === 'cash' ? 'Dinheiro recebido' : payLabels[p.method]} value={formatCents(p.method === 'cash' ? (cash?.receivedCents ?? p.cents) : p.cents)} />
          ))}
          <SumRow label="Saiu do estoque" value={sale.lines.map((l) => `${qtyText(l).replace(' un', '')} ${l.name}`).join(', ')} />
        </div>
        {/* H-P8 — comprovante por WhatsApp é opcional; nota fiscal não entra nesta versão */}
        <div className={o.card} style={{ gap: 10 }}>
          <TextField label="Comprovante por WhatsApp (opcional)" type="tel" inputMode="tel" placeholder="(00) 90000-0000" value={phone} onChange={(ev) => setPhone(formatPhone(ev.target.value))} />
          {digits.length >= 10 && (
            <a href={whatsappLink(phone, text)} target="_blank" rel="noopener noreferrer" className={o.linkInline}>
              Enviar comprovante
              <Icon name="avancar" size={18} />
            </a>
          )}
        </div>
      </main>
      <div className={o.footer}>
        <ButtonLink to="/pdv" size="l" block>
          Nova venda
        </ButtonLink>
      </div>
    </div>
  )
}
