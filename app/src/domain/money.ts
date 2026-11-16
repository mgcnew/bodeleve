// Valores monetários sempre em centavos (inteiro) — DATA_MODEL_DRAFT.md

export type Cents = number

const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

export function formatCents(value: Cents): string {
  return brl.format(value / 100)
}

/** "R$ 1.800,00", "1800,5" ou "100" → centavos; null se vazio ou inválido */
export function parseCents(text: string): Cents | null {
  const clean = text.replace(/[^\d,.]/g, '').replace(/\./g, '').replace(',', '.')
  if (!clean) return null
  const value = Number(clean)
  return Number.isFinite(value) ? Math.round(value * 100) : null
}
