import { describe, expect, it } from 'vitest'
import type { StockItem } from './inventory'
import { applyProduct, splitLabel, channelLabel, checkNewCategory, defaultSale, kindOf, marginLabel, parseMinStock, slugify, validateProduct, type ProductInput } from './catalog'

const item: StockItem = { id: 'queijo-coalho', name: 'Queijo coalho', unit: '500 g', itemType: 'finished', origin: 'house', categoryId: 'laticinios', minStock: 15, tracksExpiry: true, supplierId: null, lastCostCents: 1420 }
const input: ProductInput = { name: ' Queijo coalho 500 g ', categoryId: 'laticinios', itemType: 'finished', origin: 'house', priceCents: 3290, weightPriceCents: null, minStock: '15 un', published: true, favoritePos: true, soldByWeight: false, tracksExpiry: true, description: '' }

describe('catálogo', () => {
  it('classifica o item como no quadro: feito na casa, marca, revenda, matéria-prima', () => {
    expect(kindOf({ itemType: 'finished', origin: 'house' })).toBe('casa')
    expect(kindOf({ itemType: 'resale', origin: 'brand' })).toBe('marca')
    expect(kindOf({ itemType: 'resale', origin: 'resale' })).toBe('rev')
    expect(kindOf({ itemType: 'raw_material', origin: null })).toBe('mp')
  })

  it('canal de venda: loja e balcão, só balcão, por peso e não vende', () => {
    const sale = { ...defaultSale('x'), priceCents: 3290, published: true }
    expect(channelLabel(item, sale)).toBe('Loja e balcão')
    expect(channelLabel(item, { ...sale, published: false, soldByWeight: true })).toBe('Só balcão (por peso)')
    expect(channelLabel({ itemType: 'raw_material' }, { ...sale, soldByWeight: false })).toBe('Não vende')
    expect(channelLabel(item, { ...sale, priceCents: null })).toBe('Não vende')
  })

  it('margem como no quadro: R$ 32,90 sobre custo R$ 14,20 = 57%', () => {
    expect(marginLabel(3290, 1420)).toBe('57%')
    expect(marginLabel(0, 1420)).toBe('—')
    expect(marginLabel(3290, null)).toBe('—')
  })

  it('lê o estoque mínimo digitado com unidade', () => {
    expect(parseMinStock('15 un')).toBe(15)
    expect(parseMinStock('2,5')).toBe(2.5)
    expect(parseMinStock('abc')).toBeNull()
  })

  it('valida nome, preço e mínimo, e diz como corrigir', () => {
    expect(validateProduct(input)).toEqual({})
    expect(validateProduct({ ...input, name: '  ', priceCents: null, minStock: '' })).toEqual({
      name: 'Informe o nome do produto.',
      price: 'Informe o preço de venda, por exemplo 32,90.',
      minStock: 'Informe o estoque mínimo, por exemplo 15.',
    })
    expect(validateProduct({ ...input, itemType: 'raw_material', priceCents: null })).toEqual({})
  })

  it('vendido por peso exige o preço por kg e só guarda esse preço quando o peso está ligado', () => {
    expect(validateProduct({ ...input, soldByWeight: true }).weightPrice).toBe('Informe o preço por kg, por exemplo 59,90.')
    expect(validateProduct({ ...input, soldByWeight: true, weightPriceCents: 5990 })).toEqual({})
    expect(applyProduct(item, defaultSale(item.id), { ...input, soldByWeight: true, weightPriceCents: 5990 }).sale.weightPriceCents).toBe(5990)
    expect(applyProduct(item, defaultSale(item.id), { ...input, soldByWeight: false, weightPriceCents: 5990 }).sale.weightPriceCents).toBeNull()
  })

  it('aplicar o formulário atualiza o item e a venda; matéria-prima perde preço, loja e favorito', () => {
    const r = applyProduct(item, defaultSale(item.id), { ...input, minStock: '20 un' })
    expect(r.item).toMatchObject({ name: 'Queijo coalho', unit: '500 g', minStock: 20 })
    expect(r.sale).toMatchObject({ priceCents: 3290, published: true, favoritePos: true })
    expect(r.sale.description).toContain('[DESCRIÇÃO')
    const mp = applyProduct(item, r.sale, { ...input, itemType: 'raw_material' })
    expect(mp.item.origin).toBeNull()
    expect(mp.sale).toMatchObject({ priceCents: null, published: false, favoritePos: false })
  })

  it('o nome com a medida volta a separar nome e medida; sem a medida, tudo vira nome', () => {
    expect(splitLabel('Queijo coalho 500 g', '500 g')).toEqual({ name: 'Queijo coalho', unit: '500 g' })
    expect(splitLabel('Queijo coalho curado', '500 g')).toEqual({ name: 'Queijo coalho curado', unit: '' })
  })

  it('categoria nova: não aceita vazia nem repetida (sem diferenciar acento e maiúscula)', () => {
    const cats = [{ id: 'doces', name: 'Doces' }, { id: 'temperos', name: 'Temperos e conservas' }]
    expect(checkNewCategory('  ', cats)).toBe('empty')
    expect(checkNewCategory('DOCES', cats)).toBe('duplicate')
    expect(checkNewCategory('Castanhas', cats)).toBeNull()
    expect(slugify('Pão de Queijo!')).toBe('pao-de-queijo')
  })
})
