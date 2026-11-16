import { describe, expect, it } from 'vitest'
import { leadDaysOf, validateCourier, validateRecipe, validateSupplier, type RecipeInput, type SupplierInput } from './registry'

const supplier: SupplierInput = { name: 'Serra', supplies: 'Leite', contactName: '', phone: '(00) 90000-0101', email: '', doc: '', defaultPayment: 'boleto14', leadTimeDays: 2 }
const recipe: RecipeInput = { itemId: 'q', yieldPerBatch: 10, batchLabel: 'fornada', shelfLifeDays: 30, lotPrefix: 'QC', overheadCents: 100, method: '', lines: [{ itemId: 'l', qtyPerBatch: 20 }] }

describe('cadastros', () => {
  it('fornecedor: só o nome é obrigatório; celular, e-mail e prazo, se vierem, precisam estar certos', () => {
    expect(validateSupplier(supplier)).toEqual({})
    expect(validateSupplier({ ...supplier, name: ' ', phone: '123', email: 'x', leadTimeDays: 120 })).toEqual({ name: expect.any(String), phone: expect.any(String), email: expect.any(String), leadTime: expect.any(String) })
    expect(validateSupplier({ ...supplier, phone: '', leadTimeDays: null })).toEqual({})
  })
  it('prazo escrito vira número para editar', () => {
    expect(leadDaysOf('3 a 5 dias')).toBe(3)
    expect(leadDaysOf('')).toBeNull()
  })
  it('ficha: pede produto, rendimento e ao menos um insumo, sem repetir nem usar o próprio produto', () => {
    expect(validateRecipe(recipe)).toEqual({})
    expect(Object.keys(validateRecipe({ ...recipe, itemId: '', yieldPerBatch: 0, lines: [] }))).toEqual(['item', 'yield', 'lines'])
    expect(validateRecipe({ ...recipe, lines: [{ itemId: 'l', qtyPerBatch: 1 }, { itemId: 'l', qtyPerBatch: 2 }] }).lines).toMatch(/duas vezes/)
    expect(validateRecipe({ ...recipe, lines: [{ itemId: 'q', qtyPerBatch: 1 }] }).lines).toBeTruthy()
    expect(validateRecipe({ ...recipe, lines: [{ itemId: 'l', qtyPerBatch: 0 }] }).lines).toBeTruthy()
    expect(validateRecipe({ ...recipe, shelfLifeDays: -1 }).shelfLife).toBeTruthy()
  })
  it('entregador: nome e celular com DDD', () => {
    expect(validateCourier({ name: 'Carlos', kind: 'own', phone: '(00) 90000-0301', vehicle: '' })).toEqual({})
    expect(Object.keys(validateCourier({ name: '', kind: 'partner', phone: '1', vehicle: '' }))).toEqual(['name', 'phone'])
  })
})
