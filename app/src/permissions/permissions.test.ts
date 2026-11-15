import { describe, expect, it } from 'vitest'
import { access, can, type Module, type Role } from '.'

describe('matriz de permissões (quadro Equipe e permissões)', () => {
  const cases: Array<[Role, Module[]]> = [
    ['owner', ['dashboard', 'orders', 'pos', 'stock', 'purchasing', 'production', 'finance', 'deliveries', 'team']],
    ['manager', ['dashboard', 'orders', 'pos', 'stock', 'purchasing', 'production', 'finance', 'deliveries']],
    ['clerk', ['orders', 'pos']],
    ['production', ['stock', 'production']],
    ['courier', ['deliveries']],
  ]
  it.each(cases)('%s vê exatamente o que o quadro mostra', (role, modules) => {
    expect([...access[role]].sort()).toEqual([...modules].sort())
  })
  it('só o dono acessa equipe e configurações', () => {
    expect(can('owner', 'team')).toBe(true)
    expect(can('manager', 'team')).toBe(false)
  })
  it('quem não está logado não acessa nada', () => {
    expect(can(null, 'orders')).toBe(false)
  })
})
