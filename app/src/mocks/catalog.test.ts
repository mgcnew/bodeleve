import { describe, expect, it } from 'vitest'
import type { ProductInput } from '@/domain/catalog'
import { createMockServices } from './services'

const input: ProductInput = {
  name: 'Castanha de caju 200 g', categoryId: '', itemType: 'resale', origin: 'resale', priceCents: 2500, weightPriceCents: null, minStock: '5',
  published: true, favoritePos: false, soldByWeight: false, tracksExpiry: true, description: '',
}

describe('cadastro de produto novo (simulado)', () => {
  it('cria o item com a medida do nome, aparece na lista e na loja quando publicado', async () => {
    const s = createMockServices({ storage: null, withSeedOrders: false })
    const d = await s.admin.catalog.create(input)
    expect(d).toMatchObject({ label: 'Castanha de caju 200 g', unit: '200 g', priceCents: 2500, published: true })
    expect((await s.admin.catalog.list()).some((r) => r.id === d.id)).toBe(true)
    expect((await s.catalog.listProducts()).some((p) => p.id === d.id && p.name === 'Castanha de caju')).toBe(true)
  })

  it('o mesmo nome ganha outro identificador e o formulário inválido é recusado', async () => {
    const s = createMockServices({ storage: null, withSeedOrders: false })
    const a = await s.admin.catalog.create(input)
    const b = await s.admin.catalog.create(input)
    expect(b.id).not.toBe(a.id)
    await expect(s.admin.catalog.create({ ...input, name: ' ' })).rejects.toThrow('invalid')
  })
})
