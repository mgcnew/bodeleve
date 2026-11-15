/** Total de uma linha vendida por peso: preço por kg (centavos) × peso (kg), arredondado ao centavo. */
export function weightLineTotalCents(pricePerKgCents: number, weightKg: number): number {
  return Math.round(pricePerKgCents * weightKg)
}

/** Diferença do fechamento de caixa: contado − esperado (negativo = faltou dinheiro). */
export function cashDifferenceCents(expectedCents: number, countedCents: number): number {
  return countedCents - expectedCents
}
