import { describe, expect, it } from 'vitest'
import { cashDifferenceCents, weightLineTotalCents } from './money'

describe('weightLineTotalCents', () => {
  it('calcula o exemplo do quadro: 0,500 kg a R$ 59,90/kg = R$ 29,95', () => {
    expect(weightLineTotalCents(5990, 0.5)).toBe(2995)
  })
  it('arredonda ao centavo', () => {
    expect(weightLineTotalCents(1690, 0.333)).toBe(563) // 562,77
  })
})

describe('cashDifferenceCents', () => {
  it('é negativo quando faltou dinheiro (R$ 407 contado × R$ 412 esperado)', () => {
    expect(cashDifferenceCents(41200, 40700)).toBe(-500)
  })
})
