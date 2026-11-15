import { formatBRL } from '@/lib/format'
import { cashDifferenceCents } from '@/domain/money'
import { ValueSummary } from './ValueSummary'

type CashClosingProps = { expectedCents: number; countedCents: number }

/** Fechamento de caixa em dinheiro: esperado × contado e a diferença (o sinal "−" diz que faltou). */
export function CashClosing({ expectedCents, countedCents }: CashClosingProps) {
  const diff = cashDifferenceCents(expectedCents, countedCents)
  const value = diff === 0 ? formatBRL(0) : `${diff < 0 ? '−' : '+'} ${formatBRL(Math.abs(diff))}`
  return (
    <ValueSummary
      lines={[
        { label: 'Esperado em dinheiro', value: formatBRL(expectedCents) },
        { label: 'Contado', value: formatBRL(countedCents) },
      ]}
      total={{ label: 'Diferença', value }}
      totalTone={diff < 0 ? 'negative' : 'default'}
    />
  )
}
