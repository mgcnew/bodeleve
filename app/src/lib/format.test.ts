import { describe, expect, it } from 'vitest'
import { formatBRL, formatSignedBRL, formatDecimal, parseDecimal } from './format'

const nb = ' '

describe('formatBRL', () => {
  it('formata centavos em reais com vírgula e milhar', () => {
    expect(formatBRL(3290)).toBe(`R$${nb}32,90`)
    expect(formatBRL(128450)).toBe(`R$${nb}1.284,50`)
    expect(formatBRL(0)).toBe(`R$${nb}0,00`)
  })
})

describe('formatSignedBRL', () => {
  it('usa sinal de menos verdadeiro para saída e + para entrada', () => {
    expect(formatSignedBRL(-42000)).toBe(`− R$${nb}420,00`)
    expect(formatSignedBRL(39250)).toBe(`+ R$${nb}392,50`)
    expect(formatSignedBRL(0)).toBe(`R$${nb}0,00`)
  })
})

describe('decimais', () => {
  it('formata e lê peso digitado', () => {
    expect(formatDecimal(0.5, 3)).toBe('0,500')
    expect(parseDecimal('0,500')).toBe(0.5)
    expect(parseDecimal('1.5')).toBe(15) // ponto é milhar em pt-BR; quem digita usa vírgula
    expect(parseDecimal(' 2 ')).toBe(2)
  })
  it('rejeita vazio, texto e negativo', () => {
    expect(parseDecimal('')).toBeNull()
    expect(parseDecimal('abc')).toBeNull()
    expect(parseDecimal('-1')).toBeNull()
  })
})
