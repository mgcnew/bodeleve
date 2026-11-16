import type { Category, HomeSection, Product, StoreContent } from '@/domain/types'

/** Dados FICTÍCIOS dos quadros de design (CLAUDE.md): só para desenvolvimento. */

export const noDetails = {
  description: '[DESCRIÇÃO DO PRODUTO: como é feito, sabor, sugestão de uso]',
  conservation: '[COMO CONSERVAR]',
  validity: '[PRAZO DE VALIDADE]',
  ingredients: '[INGREDIENTES]',
}

export const categories: Category[] = [
  { id: 'laticinios', name: 'Queijos e laticínios' },
  { id: 'carnes', name: 'Carnes e embutidos' },
  { id: 'farinhas', name: 'Farinhas e grãos' },
  { id: 'doces', name: 'Doces' },
]

const p = (id: string, name: string, unit: string, priceCents: number, origin: Product['origin'], categoryId: string, available = true): Product => ({
  id, name, unit, priceCents, origin, categoryId, available, details: noDetails,
})

export const products: Product[] = [
  p('queijo-coalho', 'Queijo coalho', '500 g', 3290, 'house', 'laticinios'),
  p('queijo-manteiga', 'Queijo manteiga', '500 g', 3690, 'house', 'laticinios'),
  p('carne-de-sol', 'Carne de sol', '500 g', 3490, 'resale', 'carnes'),
  p('farinha-de-mandioca', 'Farinha de mandioca', '1 kg', 1290, 'resale', 'farinhas'),
  p('tapioca-granulada', 'Tapioca granulada', '500 g', 990, 'resale', 'farinhas'),
  p('doce-de-leite', 'Doce de leite', '400 g', 1890, 'house', 'laticinios'),
  p('rapadura', 'Rapadura', '400 g', 1450, 'brand', 'doces'),
  p('manteiga-de-garrafa', 'Manteiga de garrafa', '200 ml', 2800, 'brand', 'laticinios'),
  p('requeijao', 'Requeijão', '250 g', 1190, 'resale', 'laticinios'),
  p('nata', 'Nata', '200 g', 950, 'resale', 'laticinios'),
]

/** H-L3: seções do início. */
export const homeSections: HomeSection[] = [
  { id: 'pedidos', title: 'Mais pedidos', subtitle: 'O que mais sai no balcão.', productIds: ['queijo-coalho', 'carne-de-sol', 'farinha-de-mandioca', 'tapioca-granulada'] },
  { id: 'casa', title: 'Feitos na casa', subtitle: 'Produzidos aqui, em pequenos lotes.', productIds: ['queijo-manteiga', 'doce-de-leite'] },
  { id: 'marca', title: 'Linha Bodeleve', subtitle: 'Produtos com a marca da casa.', productIds: ['rapadura', 'manteiga-de-garrafa'] },
]

export const content: StoreContent = {
  homeText: '[TEXTO DA CASA: de onde vem, há quanto tempo existe, o que produz]',
  aboutHistory: '[HISTÓRIA DA CASA: quem fundou, quando, de onde vêm as receitas e os produtos]',
  address: '[ENDEREÇO DA LOJA]',
  hours: '[HORÁRIO DE FUNCIONAMENTO]',
  whatsapp: '[WHATSAPP DA LOJA]',
  brandText: '[TEXTO DA LINHA: o que é, por que existe, o que garante]',
  brandUpcoming: '[PRÓXIMOS PRODUTOS DA LINHA]',
  brandWhere: '[NA CASA OU POR PARCEIRO]',
  brandCommitment: '[COMPROMISSO DA MARCA]',
}
