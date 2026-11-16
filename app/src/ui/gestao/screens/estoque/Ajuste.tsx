import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Button, ButtonLink } from '@/components/Button'
import { RadioGroup, Segmented, SelectField } from '@/components/Field'
import { Icon } from '@/components/Icon'
import { QuantityStepper } from '@/components/QuantityStepper'
import { formatQty } from '@/domain/backoffice'
import { shortDate } from '@/domain/dates'
import { formatCents } from '@/domain/money'
import { balanceOf, lotsOf, registerAdjustment, removeMovements, type AdjustmentKind } from '@/services/gestao/stock'
import { useStockContext } from '@/services/gestao/useBackoffice'
import o from '@/styles/ops.module.css'
import { Bar, SumRow } from '../../../shared/OpsBits'
import s from './Estoque.module.css'

const reasons: Record<AdjustmentKind, string[]> = {
  loss: ['Embalagem danificada', 'Vencido', 'Estragou', 'Outro'],
  internal: ['Degustação', 'Usado na casa', 'Outro'],
  correction: ['Erro de lançamento', 'Contagem anterior errada', 'Outro'],
}

export function Ajuste() {
  const [params] = useSearchParams()
  const ctx = useStockContext()
  const [itemId, setItemId] = useState(params.get('item') ?? ctx.items[0].id)
  const item = ctx.items.find((i) => i.id === itemId) ?? ctx.items[0]
  const lots = lotsOf(item.id, ctx.lots, ctx.movements)
  const b = balanceOf(item.id, ctx)

  const [kind, setKind] = useState<AdjustmentKind>('loss')
  const [direction, setDirection] = useState<'out' | 'in'>('out')
  const [lotId, setLotId] = useState<string>(lots[0]?.id ?? '')
  const [qty, setQty] = useState(1)
  const [reason, setReason] = useState(reasons.loss[0])
  const [done, setDone] = useState<{ id: string; summary: string } | null>(null)

  const lot = lots.find((l) => l.id === lotId) ?? null
  const signed = kind === 'correction' && direction === 'in' ? qty : -qty
  const max = signed < 0 ? (item.tracksLots && lot ? lot.qty : b.physical) : Infinity
  const cost = qty * (lot?.unitCostCents ?? item.costCents)
  const label = kind === 'correction' && direction === 'in' ? 'Quantidade que entrou' : 'Quantidade que saiu'

  const changeItem = (id: string) => {
    setItemId(id)
    setLotId(lotsOf(id, ctx.lots, ctx.movements)[0]?.id ?? '')
    setQty(1)
  }

  const submit = () => {
    const id = registerAdjustment({ itemId: item.id, lotId: item.tracksLots ? lotId || null : null, kind, qty: signed, reason })
    const what = kind === 'loss' ? 'de custo' : kind === 'internal' ? 'de consumo' : 'corrigidos'
    setDone({
      id,
      summary: `${formatQty(qty, item.unit)} de ${item.name} · ${formatCents(cost)} ${what}${lot && item.tracksLots ? ` · lote ${lot.code}` : ''}`,
    })
  }

  if (done) {
    return (
      <div className={o.screen}>
        <Bar title="Ajustar estoque" back={`/gestao/estoque/${item.id}`} />
        <main className={s.done}>
          <div aria-hidden="true" className={s.doneIcon}>
            <Icon name="confirmar" size={32} />
          </div>
          <h2 style={{ font: '700 24px/30px var(--fonte-titulo)' }}>{signed > 0 ? 'Entrada registrada' : 'Saída registrada'}</h2>
          <p className={`${o.secondary} ${o.num}`}>{done.summary}</p>
        </main>
        <div className={o.footer}>
          <ButtonLink to={`/gestao/estoque/${item.id}`} size="l" block>
            Voltar ao item
          </ButtonLink>
          <Button
            variant="secondary"
            block
            onClick={() => {
              removeMovements([done.id])
              setDone(null)
            }}
          >
            Desfazer
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className={o.screen}>
      <Bar title="Ajustar estoque" back={params.get('item') ? `/gestao/estoque/${item.id}` : '/gestao/estoque'} />
      <main className={`${o.main} ${o.mainTop} ${o.narrow}`}>
        {params.get('item') ? (
          <div>
            <div className={o.bold}>{item.name}</div>
            <div className={`${o.muted} ${o.num}`}>
              Físico {formatQty(b.physical, item.unit)} · disponível {formatQty(b.available, item.unit)}
            </div>
          </div>
        ) : (
          <SelectField label="Item" value={item.id} onChange={(e) => changeItem(e.target.value)} options={ctx.items.map((i) => ({ value: i.id, label: i.name }))} />
        )}
        <RadioGroup
          legend="O que aconteceu?"
          name="tipo"
          value={kind}
          onChange={(k) => {
            setKind(k)
            setReason(reasons[k][0])
            setDirection('out')
          }}
          options={[
            { value: 'loss', title: 'Perda', sub: 'Vencido, danificado, estragado' },
            { value: 'internal', title: 'Consumo interno', sub: 'Usado na casa, degustação' },
            { value: 'correction', title: 'Correção de contagem', sub: 'O sistema estava errado' },
          ]}
        />
        {kind === 'correction' && (
          <Segmented
            label="Sentido da correção"
            value={direction}
            onChange={setDirection}
            options={[
              { value: 'out', label: 'Tirar do estoque' },
              { value: 'in', label: 'Somar ao estoque' },
            ]}
          />
        )}
        {item.tracksLots && lots.length > 0 && (
          <SelectField
            label="Lote"
            value={lotId}
            onChange={(e) => setLotId(e.target.value)}
            options={lots.map((l) => ({ value: l.id, label: `${l.code} · ${l.expiry ? `vence ${shortDate(l.expiry)}` : 'sem validade'} · ${formatQty(l.qty, item.unit)}` }))}
          />
        )}
        <div className={o.card} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px' }}>
          <span id="qtd-ajuste" className={o.bold}>
            {label}
          </span>
          <QuantityStepper labelledBy="qtd-ajuste" value={qty} min={1} onChange={(v) => setQty(Math.min(v, max))} />
        </div>
        <SelectField label="Motivo" value={reason} onChange={(e) => setReason(e.target.value)} options={reasons[kind].map((r) => ({ value: r, label: r }))} />
        <div className={o.card}>
          <SumRow label="Saldo físico" value={`${formatQty(b.physical, item.unit)} → ${formatQty(Math.round((b.physical + signed) * 1000) / 1000, item.unit)}`} />
          <SumRow label={kind === 'loss' ? 'Custo da perda' : 'Custo'} value={formatCents(cost)} />
        </div>
      </main>
      <div className={o.footer}>
        <Button size="l" block onClick={submit}>
          {signed > 0 ? 'Registrar entrada' : 'Registrar saída'}
        </Button>
      </div>
    </div>
  )
}
