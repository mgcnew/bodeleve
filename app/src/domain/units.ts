/** Medidas de peso: a embalagem de estoque ("500 g", "1 kg") dá quanto pesa cada unidade, para vender por peso no balcão. */

/** Peso de 1 unidade de estoque em kg: "500 g" → 0,5; "1 kg" → 1; "1,5 kg" → 1,5. `null` se a medida não é de peso. */
export function unitKg(unit: string): number | null {
  const m = unit.trim().toLowerCase().match(/^(\d+(?:[.,]\d+)?)\s*(kg|g)$/)
  if (!m) return null
  const n = Number(m[1].replace(',', '.'))
  if (!(n > 0)) return null
  return m[2] === 'kg' ? n : n / 1000
}

/** Quantos kg viram quantas unidades de estoque (0,75 kg de um item de "500 g" = 1,5 un). Arredonda a 4 casas para não acumular erro. */
export const kgToUnits = (kg: number, unit: string): number => {
  const per = unitKg(unit)
  return per == null ? kg : Math.round((kg / per) * 10_000) / 10_000
}

export const unitsToKg = (units: number, unit: string): number => {
  const per = unitKg(unit)
  return per == null ? units : Math.round(units * per * 10_000) / 10_000
}

/** "0,500 kg" (3 casas, como no quadro). */
export const formatKg = (kg: number): string => `${kg.toFixed(3).replace('.', ',')} kg`

/** "6,4 kg", "9 kg": sem zeros sobrando. */
export const formatKgShort = (kg: number): string => `${String(Math.round(kg * 100) / 100).replace('.', ',')} kg`
