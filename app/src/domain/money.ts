// Valores monetários sempre em centavos (inteiro) — DATA_MODEL_DRAFT.md

export type Cents = number

const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

export function formatCents(value: Cents): string {
  return brl.format(value / 100)
}
