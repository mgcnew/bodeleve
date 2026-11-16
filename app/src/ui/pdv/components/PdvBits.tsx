import type { ReactNode } from 'react'
import { Button } from '@/components/Button'
import { Sheet } from '@/components/Sheet'
import { QuantityStepper } from '@/components/QuantityStepper'
import { hypotheses } from '@/config/hypotheses'
import { formatCents } from '@/domain/money'
import { lineTotal, qtyText, type CartLine } from '@/domain/pdv'
import s from '../screens/Pdv.module.css'

/** Chip grande de 48 px para atalhos de valor */
export function BigChip({ children, active, onClick }: { children: ReactNode; active?: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      style={{
        height: 48,
        borderRadius: 12,
        border: '1.5px solid var(--cor-grafite)',
        background: active ? 'var(--cor-grafite)' : 'var(--superficie)',
        color: active ? 'var(--superficie)' : 'var(--texto)',
        font: '600 15px var(--fonte-texto)',
        cursor: 'pointer',
      }}
    >
      {children}
    </button>
  )
}

/** H-P2 — peso digitado com atalhos (250 g, 500 g, 1 kg) e ajuste de 50 g */
export function WeightSheet({
  open,
  name,
  unitPriceCents,
  grams,
  onGrams,
  onConfirm,
  onClose,
  confirmLabel = 'Adicionar',
}: {
  open: boolean
  name: string
  unitPriceCents: number
  grams: number
  onGrams: (g: number) => void
  onConfirm: () => void
  onClose: () => void
  confirmLabel?: string
}) {
  return (
    <Sheet open={open} onClose={onClose} title="Informar peso">
      <div>
        <div className={s.lineName}>{name}</div>
        <div style={{ color: 'var(--texto-secundario)' }}>{formatCents(unitPriceCents)} / kg</div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <span id="peso-rotulo" style={{ fontWeight: 600 }}>
          Peso em gramas
        </span>
        <QuantityStepper labelledBy="peso-rotulo" value={grams} step={hypotheses.weightStepG} min={hypotheses.weightStepG} onChange={onGrams} large />
      </div>
      <div className={s.chipRow} role="group" aria-label="Pesos comuns">
        {hypotheses.weightShortcutsG.map((g) => (
          <BigChip key={g} active={grams === g} onClick={() => onGrams(g)}>
            {g >= 1000 ? `${g / 1000} kg` : `${g} g`}
          </BigChip>
        ))}
      </div>
      <Button size="l" block onClick={onConfirm}>
        {confirmLabel} · {formatCents(Math.round((unitPriceCents * grams) / 1000))}
      </Button>
      <Button variant="secondary" block onClick={onClose}>
        Cancelar
      </Button>
    </Sheet>
  )
}

export function CartLineView({ line, onQty, onWeight }: { line: CartLine; onQty: (q: number) => void; onWeight: () => void }) {
  return (
    <li className={s.line}>
      <div className={s.lineText}>
        <div className={s.lineName}>{line.name}</div>
        <div style={{ font: '400 13px/18px var(--fonte-texto)', color: 'var(--texto-secundario)', fontVariantNumeric: 'tabular-nums' }}>
          {line.grams !== null ? `${qtyText(line)} × ${formatCents(line.unitPriceCents)}` : `${formatCents(line.unitPriceCents)} cada`}
        </div>
        <div className={s.lineTotal}>{formatCents(lineTotal(line))}</div>
      </div>
      {line.grams !== null ? (
        <Button variant="secondary" onClick={onWeight} aria-label={`Alterar peso de ${line.name}`}>
          Peso
        </Button>
      ) : (
        <QuantityStepper label={`Quantidade de ${line.name}`} value={line.quantity} onChange={onQty} />
      )}
    </li>
  )
}
