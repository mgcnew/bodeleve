/**
 * Formatação pt-BR. Dinheiro é inteiro em centavos (DATA_MODEL_DRAFT.md); só aqui vira texto.
 * O espaço entre "R$" e o número é inseparável, para o símbolo não ficar sozinho na linha.
 */
const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

export function formatBRL(cents: number): string {
  return brl.format(cents / 100)
}

/** Valor com sinal explícito para lançamentos: "+ R$ 392,50", "− R$ 420,00" (sinal de menos verdadeiro). */
export function formatSignedBRL(cents: number): string {
  if (cents === 0) return formatBRL(0)
  return `${cents > 0 ? '+' : '−'} ${formatBRL(Math.abs(cents))}`
}

/** Quantidade decimal: formatDecimal(0.5, 3) -> "0,500". */
export function formatDecimal(value: number, fractionDigits = 0): string {
  return value.toLocaleString('pt-BR', {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  })
}

/** Lê "0,500" ou "0.5" digitado; devolve null se não for número válido e não negativo. */
export function parseDecimal(text: string): number | null {
  const normalized = text.trim().replace(/\./g, '').replace(',', '.')
  if (normalized === '') return null
  const n = Number(normalized)
  return Number.isFinite(n) && n >= 0 ? n : null
}
