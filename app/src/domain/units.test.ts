import { describe, expect, it } from 'vitest'
import { formatKg, formatKgShort, kgToUnits, unitKg, unitsToKg } from './units'

describe('medidas de peso', () => {
  it('lê o peso de cada embalagem', () => {
    expect(unitKg('500 g')).toBe(0.5)
    expect(unitKg('1 kg')).toBe(1)
    expect(unitKg('250 g')).toBe(0.25)
    expect(unitKg('1,5 kg')).toBe(1.5)
    expect(unitKg('200 ml')).toBeNull()
    expect(unitKg('')).toBeNull()
    expect(unitKg('0 g')).toBeNull()
  })

  it('converte kg em unidades de estoque e de volta', () => {
    expect(kgToUnits(0.75, '500 g')).toBe(1.5)
    expect(kgToUnits(0.5, '500 g')).toBe(1)
    expect(kgToUnits(0.333, '1 kg')).toBe(0.333)
    expect(unitsToKg(13, '500 g')).toBe(6.5)
    expect(kgToUnits(2, 'un')).toBe(2)
  })

  it('formata como no quadro', () => {
    expect(formatKg(0.5)).toBe('0,500 kg')
    expect(formatKg(0.75)).toBe('0,750 kg')
    expect(formatKgShort(6.4)).toBe('6,4 kg')
    expect(formatKgShort(9)).toBe('9 kg')
  })
})
