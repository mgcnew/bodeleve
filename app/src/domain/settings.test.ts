import { describe, expect, it } from 'vitest'
import { checkInvite, cleanHouse, emptyHouse, hoursText, rolesInUse, roleMatrix, validateHouse, type TeamMember } from './settings'

const team: TeamMember[] = [
  { id: '1', name: 'Dono', email: 'dono@exemplo.com', role: 'owner', note: '' },
  { id: '2', name: 'Ana', email: 'ana@exemplo.com', role: 'manager', note: '' },
  { id: '3', name: 'Carlos', email: 'carlos@exemplo.com', role: 'courier', note: 'Próprio' },
  { id: '4', name: 'Bruno', email: 'bruno@exemplo.com', role: 'courier', note: 'Próprio' },
]

describe('a casa', () => {
  it('só o nome é obrigatório; CNPJ e WhatsApp, se preenchidos, precisam estar completos', () => {
    expect(validateHouse(emptyHouse)).toEqual({})
    expect(validateHouse({ ...emptyHouse, name: ' ' })).toEqual({ name: 'Informe o nome da casa.' })
    expect(validateHouse({ ...emptyHouse, cnpj: '12.345.678/0001-9' }).cnpj).toMatch(/14 números/)
    expect(validateHouse({ ...emptyHouse, cnpj: '12.345.678/0001-95' })).toEqual({})
    expect(validateHouse({ ...emptyHouse, whatsapp: '9000' }).whatsapp).toMatch(/DDD/)
    expect(validateHouse({ ...emptyHouse, whatsapp: '(00) 90000-0000' })).toEqual({})
  })

  it('o horário da loja junta só o que foi preenchido', () => {
    expect(hoursText({ weekdays: '', saturday: '', sunday: '' })).toBe('')
    expect(hoursText({ weekdays: '8h às 18h', saturday: '8h às 14h', sunday: '' })).toBe('Segunda a sexta: 8h às 18h · Sábado: 8h às 14h')
    expect(cleanHouse({ ...emptyHouse, name: ' Bodeleve ', address: ' Rua A ' })).toMatchObject({ name: 'Bodeleve', address: 'Rua A' })
  })
})

describe('equipe', () => {
  it('conta pessoas e papéis distintos', () => {
    expect(team).toHaveLength(4)
    expect(rolesInUse(team)).toBe(3)
  })

  it('convite: e-mail válido, papel permitido e sem repetir', () => {
    expect(checkInvite('nome@exemplo.com', 'clerk', team)).toBeNull()
    expect(checkInvite('nome', 'clerk', team)).toBe('invalid_email')
    expect(checkInvite('ANA@exemplo.com', 'clerk', team)).toBe('duplicate')
    expect(checkInvite('nome@exemplo.com', 'owner', team)).toBe('invalid_role')
  })

  it('matriz por papel: dono vê tudo; atendente só pedidos e PDV; entregador só entregas', () => {
    expect(roleMatrix('owner').every((r) => r.allowed)).toBe(true)
    expect(roleMatrix('manager').find((r) => r.module === 'team')!.allowed).toBe(false)
    expect(roleMatrix('clerk').filter((r) => r.allowed).map((r) => r.label)).toEqual(['Pedidos', 'PDV (balcão)'])
    expect(roleMatrix('production').filter((r) => r.allowed).map((r) => r.label)).toEqual(['Estoque', 'Produção'])
    expect(roleMatrix('courier').filter((r) => r.allowed).map((r) => r.label)).toEqual(['Entregas'])
    expect(roleMatrix('owner').map((r) => r.label)[0]).toBe('Início e relatórios')
  })
})

describe('senha de gestor', () => {
  it('4 a 8 números, iguais nas duas vezes', async () => {
    const { checkPin } = await import('./settings')
    expect(checkPin('1234', '1234')).toBeNull()
    expect(checkPin('123', '123')).toBe('format')
    expect(checkPin('12a4', '12a4')).toBe('format')
    expect(checkPin('123456789', '123456789')).toBe('format')
    expect(checkPin('1234', '4321')).toBe('mismatch')
  })
})
