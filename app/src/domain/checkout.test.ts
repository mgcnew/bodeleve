import { describe, expect, it } from 'vitest'
import { formatCep, formatPhone, isValidCep, isValidPhone, parseChangeFor, validateAddress, validateContact } from './checkout'

describe('telefone', () => {
  it('formata enquanto digita', () => {
    expect(formatPhone('11')).toBe('(11')
    expect(formatPhone('1198765')).toBe('(11) 98765')
    expect(formatPhone('11987654321')).toBe('(11) 98765-4321')
    expect(formatPhone('119876543')).toBe('(11) 98765-43')
    expect(formatPhone('1133334444')).toBe('(11) 3333-4444')
    expect(formatPhone('113333444455')).toBe('(11) 3333-4444')
  })
  it('aceita DDI 55 colado', () => {
    expect(formatPhone('+55 11 98765-4321')).toBe('(11) 98765-4321')
  })
  it('valida 10 ou 11 dígitos', () => {
    expect(isValidPhone('(11) 98765-4321')).toBe(true)
    expect(isValidPhone('(11) 9876-54')).toBe(false)
  })
})

describe('CEP', () => {
  it('formata e valida', () => {
    expect(formatCep('12345678')).toBe('12345-678')
    expect(isValidCep('12345-678')).toBe(true)
    expect(isValidCep('1234')).toBe(false)
  })
})

describe('validações com mensagem que ensina a corrigir', () => {
  it('contato', () => {
    expect(validateContact({ name: '', phone: '' })).toEqual({
      name: 'Informe seu nome.',
      phone: 'Informe o celular com DDD, por exemplo (11) 98765-4321.',
    })
    expect(validateContact({ name: 'Ana Souza', phone: '(11) 98765-4321' })).toEqual({})
  })
  it('endereço', () => {
    const e = validateAddress({ cep: '12', street: '', number: '', complement: '', district: '', reference: '' })
    expect(Object.keys(e).sort()).toEqual(['cep', 'district', 'number', 'street'])
  })
})

describe('troco', () => {
  it('vazio = sem troco', () => expect(parseChangeFor('', 8120)).toEqual({ cents: null }))
  it('lê "R$ 100,00"', () => expect(parseChangeFor('R$ 100,00', 8120)).toEqual({ cents: 10000 }))
  it('recusa valor menor que o total', () => {
    expect(parseChangeFor('50', 8120).error).toMatch(/maior ou igual/)
  })
  it('recusa texto', () => expect(parseChangeFor('abc', 8120).error).toMatch(/Informe um valor/))
})
