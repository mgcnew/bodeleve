import { describe, expect, it } from 'vitest'
import { createMockServices } from './services'

const svc = () => createMockServices({ storage: null, withSeedOrders: true })

describe('cadastros (simulado)', () => {
  it('fornecedor novo aparece na lista e pode ser editado', async () => {
    const { admin } = svc()
    const f = await admin.purchasing.saveSupplier(null, { name: 'Sítio Novo', supplies: 'Ovos', contactName: '', phone: '(00) 90000-0999', email: '', doc: '', defaultPayment: 'pix_on_delivery', leadTimeDays: 1 })
    expect(f).toMatchObject({ id: 'sitio-novo', leadTime: '1 dia', defaultPayment: 'pix_on_delivery' })
    expect(f.contactName).toMatch(/^\[/)
    const g = await admin.purchasing.saveSupplier(f.id, { name: 'Sítio Novo', supplies: 'Ovos e leite', contactName: 'Zé', phone: '', email: '', doc: '', defaultPayment: 'boleto14', leadTimeDays: null })
    expect(g).toMatchObject({ supplies: 'Ovos e leite', contactName: 'Zé' })
    await expect(admin.purchasing.saveSupplier(null, { ...g, name: '' } as never)).rejects.toThrow('invalid')
  })

  it('ficha técnica: só para produto acabado, uma por produto', async () => {
    const { admin } = svc()
    const o = await admin.production.recipeOptions()
    const free = o.products.find((p) => !(['ft-queijo-coalho-500-g'].includes(p.id)))
    expect(o.products.length).toBeGreaterThan(0)
    const recipes = await admin.production.listRecipes()
    const withRecipe = new Set(recipes.map((r) => r.itemId))
    const candidate = o.products.find((p) => !withRecipe.has(p.id)) ?? free!
    const input = { itemId: candidate.id, yieldPerBatch: 5, batchLabel: 'tacho', shelfLifeDays: 20, lotPrefix: 'zz', overheadCents: 50, method: '', lines: [{ itemId: o.inputs.find((x) => x.id !== candidate.id)!.id, qtyPerBatch: 2 }] }
    if (withRecipe.has(candidate.id)) await expect(admin.production.saveRecipe(null, input)).rejects.toThrow('duplicate')
    else {
      const r = await admin.production.saveRecipe(null, input)
      expect(r).toMatchObject({ yieldPerBatch: 5, batchLabel: 'tacho', lotPrefix: 'ZZ' })
      await expect(admin.production.saveRecipe(null, input)).rejects.toThrow('duplicate')
    }
    await expect(admin.production.saveRecipe(null, { ...input, lines: [] })).rejects.toThrow('invalid')
  })

  it('entregador: celular repetido é recusado', async () => {
    const { admin } = svc()
    const c = await admin.deliveries.saveCourier(null, { name: 'Paulo', kind: 'partner', phone: '(00) 90000-0777', vehicle: 'Moto' })
    expect(c.name).toBe('Paulo')
    await expect(admin.deliveries.saveCourier(null, { name: 'Outro', kind: 'own', phone: '(00)90000-0777', vehicle: '' })).rejects.toThrow('duplicate')
    expect((await admin.deliveries.getCourier(c.id))?.phone).toBe('(00) 90000-0777')
    await expect(admin.deliveries.saveCourier(null, { name: '', kind: 'own', phone: '1', vehicle: '' })).rejects.toThrow('invalid')
  })
})
