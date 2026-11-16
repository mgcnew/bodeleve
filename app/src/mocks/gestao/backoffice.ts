// Dados fictícios da gestão (design/Gestao-*.dc.html). Datas relativas a hoje.
import type { FinancialEntry, Item, Lot, Movement, Purchase, Supplier } from '@/domain/backoffice'
import { daysFromToday, minutesBefore } from '@/domain/dates'

export const suppliers: Supplier[] = [
  { id: 'engenho-boa-vista', name: 'Engenho Boa Vista', categories: 'Rapadura, melaço, açúcar', contactName: 'Seu Antônio', phone: '(00) 90000-0100', email: '[E-MAIL]', document: '[CNPJ OU CPF]', since: '2024', paymentTerms: 'Boleto, 14 dias', paymentDays: 14, leadTime: '3 a 5 dias' },
  { id: 'serra-verde', name: 'Laticínios Serra Verde', categories: 'Leite, requeijão, nata', contactName: 'Dona Célia', phone: '(00) 90000-0101', email: '[E-MAIL]', document: '[CNPJ OU CPF]', since: '2023', paymentTerms: 'Boleto, 14 dias', paymentDays: 14, leadTime: '1 a 3 dias' },
  { id: 'moinho-sertao', name: 'Moinho Sertão', categories: 'Farinhas, tapioca, flocão', contactName: 'Jorge', phone: '(00) 90000-0102', email: '[E-MAIL]', document: '[CNPJ OU CPF]', since: '2023', paymentTerms: 'Pix na entrega', paymentDays: 0, leadTime: '5 a 7 dias' },
  { id: 'charqueada-norte', name: 'Charqueada Norte', categories: 'Carne de sol, charque', contactName: 'Raimundo', phone: '(00) 90000-0103', email: '[E-MAIL]', document: '[CNPJ OU CPF]', since: '2024', paymentTerms: 'Boleto, 21 dias', paymentDays: 21, leadTime: '3 a 5 dias' },
]

type ItemSeed = Pick<Item, 'id' | 'name' | 'unit' | 'itemType' | 'origin' | 'categoryId' | 'minStock' | 'costCents'> & Partial<Item>

const seedItems: ItemSeed[] = [
  { id: 'queijo-coalho', name: 'Queijo coalho 500 g', unit: 'un', itemType: 'finished', origin: 'house_made', categoryId: 'queijos', minStock: 15, costCents: 1420, priceCents: 3290, tracksLots: true, published: true, favoritePos: true },
  { id: 'queijo-manteiga', name: 'Queijo manteiga 500 g', unit: 'un', itemType: 'finished', origin: 'house_made', categoryId: 'queijos', minStock: 6, costCents: 1680, priceCents: 3690, tracksLots: true, published: true },
  { id: 'doce-de-leite', name: 'Doce de leite 400 g', unit: 'un', itemType: 'finished', origin: 'house_made', categoryId: 'doces', minStock: 8, costCents: 790, priceCents: 1890, tracksLots: true, published: true, favoritePos: true },
  { id: 'tapioca-granulada', name: 'Tapioca granulada 500 g', unit: 'un', itemType: 'resale', origin: 'third_party', categoryId: 'farinhas', minStock: 10, costCents: 520, priceCents: 990, supplierId: 'moinho-sertao', published: true, favoritePos: true },
  { id: 'rapadura', name: 'Rapadura 400 g', unit: 'un', itemType: 'resale', origin: 'bodeleve_brand', categoryId: 'doces', minStock: 12, costCents: 780, priceCents: 1450, supplierId: 'engenho-boa-vista', tracksLots: true, published: true, favoritePos: true },
  { id: 'melaco', name: 'Melaço de cana 500 ml', unit: 'un', itemType: 'resale', origin: 'third_party', categoryId: 'doces', minStock: 6, costCents: 950, priceCents: 1690, supplierId: 'engenho-boa-vista', published: true },
  { id: 'acucar-mascavo', name: 'Açúcar mascavo 1 kg', unit: 'un', itemType: 'resale', origin: 'third_party', categoryId: 'doces', minStock: 6, costCents: 820, priceCents: 1490, supplierId: 'engenho-boa-vista', published: true },
  { id: 'nata', name: 'Nata 200 g', unit: 'un', itemType: 'resale', origin: 'third_party', categoryId: 'queijos', minStock: 6, costCents: 520, priceCents: 950, supplierId: 'serra-verde', tracksLots: true, published: true },
  { id: 'requeijao', name: 'Requeijão 250 g', unit: 'un', itemType: 'resale', origin: 'third_party', categoryId: 'queijos', minStock: 8, costCents: 680, priceCents: 1190, supplierId: 'serra-verde', tracksLots: true, published: true },
  { id: 'farinha-de-mandioca', name: 'Farinha de mandioca 1 kg', unit: 'un', itemType: 'resale', origin: 'third_party', categoryId: 'farinhas', minStock: 12, costCents: 640, priceCents: 1290, supplierId: 'moinho-sertao', published: true, favoritePos: true },
  { id: 'manteiga-de-garrafa', name: 'Manteiga de garrafa 200 ml', unit: 'un', itemType: 'resale', origin: 'bodeleve_brand', categoryId: 'queijos', minStock: 6, costCents: 1500, priceCents: 2800, supplierId: 'serra-verde', published: true, favoritePos: true },
  { id: 'carne-de-sol', name: 'Carne de sol', unit: 'kg', itemType: 'resale', origin: 'third_party', categoryId: 'carnes', minStock: 5, costCents: 3600, priceCents: 5990, supplierId: 'charqueada-norte', tracksLots: true, soldByWeight: true, published: true, favoritePos: true },
  { id: 'feijao-de-corda', name: 'Feijão de corda', unit: 'kg', itemType: 'resale', origin: 'third_party', categoryId: 'farinhas', minStock: 5, costCents: 980, priceCents: 1690, supplierId: 'moinho-sertao', soldByWeight: true, favoritePos: true },
  { id: 'leite-integral', name: 'Leite integral 1 L', unit: 'L', itemType: 'raw_material', origin: null, categoryId: 'insumos', minStock: 40, costCents: 310, supplierId: 'serra-verde', tracksLots: true },
  { id: 'coalho-liquido', name: 'Coalho líquido 50 ml', unit: 'un', itemType: 'raw_material', origin: null, categoryId: 'insumos', minStock: 3, costCents: 1200, supplierId: 'serra-verde' },
  { id: 'sal', name: 'Sal 1 kg', unit: 'kg', itemType: 'raw_material', origin: null, categoryId: 'insumos', minStock: 2, costCents: 300 },
  { id: 'acucar', name: 'Açúcar cristal', unit: 'kg', itemType: 'raw_material', origin: null, categoryId: 'insumos', minStock: 5, costCents: 450, supplierId: 'engenho-boa-vista' },
]

export const seedItemsList = (): Item[] =>
  seedItems.map((i) => ({
    priceCents: null,
    supplierId: null,
    tracksLots: false,
    soldByWeight: false,
    published: false,
    favoritePos: false,
    ...i,
  }))

/** lotes: [itemId, código, validade em dias (null = sem validade), qtd inicial] */
const lotSeeds: [string, string, number | null, number][] = [
  ['queijo-coalho', 'QC-1107', 5, 4],
  ['queijo-coalho', 'QC-1112', 12, 10],
  ['queijo-manteiga', 'QM-1109', 20, 9],
  ['doce-de-leite', 'DL-1102', 6, 9],
  ['nata', 'NT-1101', 4, 5],
  ['requeijao', 'RQ-1104', 30, 14],
  ['rapadura', 'RB-0412', 120, 4],
  ['carne-de-sol', 'CS-1110', 9, 6.4],
  ['leite-integral', 'LT-1113', 3, 18],
]

const looseStock: [string, number][] = [
  ['tapioca-granulada', 3],
  ['melaco', 6],
  ['acucar-mascavo', 10],
  ['farinha-de-mandioca', 26],
  ['manteiga-de-garrafa', 11],
  ['feijao-de-corda', 9],
  ['coalho-liquido', 1],
  ['sal', 4],
  ['acucar', 12],
]

export function seedStock(items: Item[]): { lots: Lot[]; movements: Movement[] } {
  const cost = (id: string) => items.find((i) => i.id === id)?.costCents ?? 0
  const lots: Lot[] = lotSeeds.map(([itemId, code, days]) => ({
    id: `lot-${code}`,
    itemId,
    code,
    expiry: days === null ? null : daysFromToday(days),
    unitCostCents: cost(itemId),
    createdAt: daysFromToday(-5),
  }))
  let n = 0
  const mv = (m: Omit<Movement, 'id'>): Movement => ({ id: `mv-${++n}`, ...m })
  const movements: Movement[] = [
    ...lotSeeds.map(([itemId, code, , qty]) =>
      mv({ itemId, lotId: `lot-${code}`, type: itemId === 'queijo-coalho' || itemId === 'doce-de-leite' || itemId === 'queijo-manteiga' ? 'production_in' : 'purchase_in', qty, at: daysFromToday(-5, 9), note: `Entrada do lote ${code}`, by: 'Ana', ref: null }),
    ),
    ...looseStock.map(([itemId, qty]) => mv({ itemId, lotId: null, type: 'inventory', qty, at: daysFromToday(-10, 18), note: 'Contagem inicial', by: 'Ana', ref: null })),
  ]
  // histórico do queijo coalho (Gestao-EstoqueItem)
  movements.push(
    mv({ itemId: 'queijo-coalho', lotId: 'lot-QC-1107', type: 'adjustment', qty: 7, at: daysFromToday(-5, 10), note: 'Correção de contagem', by: 'Ana', ref: null }),
    mv({ itemId: 'queijo-coalho', lotId: 'lot-QC-1107', type: 'sale_out', qty: -3, at: daysFromToday(-5, 16, 20), note: 'Venda no balcão', by: 'Rita', ref: null }),
    mv({ itemId: 'queijo-coalho', lotId: 'lot-QC-1107', type: 'loss', qty: -1, at: daysFromToday(-4, 18, 5), note: 'Perda · embalagem danificada', by: 'Ana', ref: null }),
    mv({ itemId: 'queijo-coalho', lotId: 'lot-QC-1107', type: 'sale_out', qty: -1, at: minutesBefore(500), note: 'Venda online · pedido #1037', by: 'Sistema', ref: '1037' }),
    mv({ itemId: 'queijo-coalho', lotId: 'lot-QC-1107', type: 'sale_out', qty: -2, at: minutesBefore(150), note: 'Venda no balcão', by: 'Rita', ref: null }),
  )
  return { lots, movements }
}

export const seedPurchases = (): Purchase[] => [
  {
    id: 'pc-0057', number: 'PC-0057', supplierId: 'serra-verde', status: 'sent', sentAt: daysFromToday(-3), expectedAt: daysFromToday(0), receivedAt: null, paymentTerms: 'Boleto, 14 dias após receber',
    items: [
      { itemId: 'leite-integral', name: 'Leite integral 1 L', qty: 140, unitCostCents: 310, receivedQty: 0 },
      { itemId: 'requeijao', name: 'Requeijão 250 g', qty: 20, unitCostCents: 680, receivedQty: 0 },
      { itemId: 'nata', name: 'Nata 200 g', qty: 12, unitCostCents: 520, receivedQty: 0 },
    ],
  },
  {
    id: 'pc-0056', number: 'PC-0056', supplierId: 'moinho-sertao', status: 'sent', sentAt: daysFromToday(-2), expectedAt: daysFromToday(2), receivedAt: null, paymentTerms: 'Pix na entrega',
    items: [
      { itemId: 'farinha-de-mandioca', name: 'Farinha de mandioca 1 kg', qty: 30, unitCostCents: 640, receivedQty: 0 },
      { itemId: 'tapioca-granulada', name: 'Tapioca granulada 500 g', qty: 30, unitCostCents: 520, receivedQty: 0 },
      { itemId: 'feijao-de-corda', name: 'Feijão de corda', qty: 10, unitCostCents: 980, receivedQty: 0 },
      { itemId: 'acucar', name: 'Açúcar cristal', qty: 2, unitCostCents: 450, receivedQty: 0 },
    ],
  },
  {
    id: 'pc-0055', number: 'PC-0055', supplierId: 'charqueada-norte', status: 'sent', sentAt: daysFromToday(-1), expectedAt: daysFromToday(3), receivedAt: null, paymentTerms: 'Boleto, 21 dias após receber',
    items: [{ itemId: 'carne-de-sol', name: 'Carne de sol', qty: 20, unitCostCents: 3590, receivedQty: 0 }],
  },
  {
    id: 'pc-0054', number: 'PC-0054', supplierId: 'moinho-sertao', status: 'received', sentAt: daysFromToday(-14), expectedAt: daysFromToday(-9), receivedAt: daysFromToday(-9), paymentTerms: 'Pix na entrega',
    items: [
      { itemId: 'farinha-de-mandioca', name: 'Farinha de mandioca 1 kg', qty: 40, unitCostCents: 640, receivedQty: 40 },
      { itemId: 'tapioca-granulada', name: 'Tapioca granulada 500 g', qty: 49, unitCostCents: 520, receivedQty: 49 },
    ],
  },
  {
    id: 'pc-0053', number: 'PC-0053', supplierId: 'serra-verde', status: 'partially_received', sentAt: daysFromToday(-20), expectedAt: daysFromToday(-16), receivedAt: daysFromToday(-16), paymentTerms: 'Boleto, 14 dias após receber',
    items: [
      { itemId: 'leite-integral', name: 'Leite integral 1 L', qty: 100, unitCostCents: 310, receivedQty: 100 },
      { itemId: 'nata', name: 'Nata 200 g', qty: 20, unitCostCents: 520, receivedQty: 0 },
    ],
  },
  {
    id: 'pc-0049', number: 'PC-0049', supplierId: 'engenho-boa-vista', status: 'received', sentAt: daysFromToday(-24), expectedAt: daysFromToday(-19), receivedAt: daysFromToday(-19), paymentTerms: 'Boleto, 14 dias após receber',
    items: [
      { itemId: 'rapadura', name: 'Rapadura 400 g', qty: 18, unitCostCents: 780, receivedQty: 18 },
      { itemId: 'melaco', name: 'Melaço de cana 500 ml', qty: 10, unitCostCents: 950, receivedQty: 10 },
    ],
  },
  {
    id: 'pc-0038', number: 'PC-0038', supplierId: 'engenho-boa-vista', status: 'received', sentAt: daysFromToday(-56), expectedAt: daysFromToday(-51), receivedAt: daysFromToday(-51), paymentTerms: 'Boleto, 14 dias após receber',
    items: [{ itemId: 'rapadura', name: 'Rapadura 400 g', qty: 40, unitCostCents: 780, receivedQty: 40 }],
  },
]

export const seedEntries = (): FinancialEntry[] => {
  const e = (x: Partial<FinancialEntry> & Pick<FinancialEntry, 'id' | 'direction' | 'description' | 'counterpart' | 'categoryId' | 'amountCents' | 'dueDate'>): FinancialEntry => ({
    paidAt: null,
    paidAmountCents: 0,
    accountId: null,
    origin: 'manual',
    ref: null,
    recurring: false,
    ...x,
  })
  return [
    e({ id: 'fe-aluguel', direction: 'payable', description: 'Aluguel', counterpart: 'Imobiliária Centro', categoryId: 'aluguel', amountCents: 180000, dueDate: daysFromToday(-4), recurring: true, origin: 'recorrente' }),
    e({ id: 'fe-pc0053', direction: 'payable', description: 'Compra PC-0053', counterpart: 'Laticínios Serra Verde', categoryId: 'compras', amountCents: 42000, dueDate: daysFromToday(0), origin: 'compra', ref: 'pc-0053' }),
    e({ id: 'fe-energia', direction: 'payable', description: 'Energia', counterpart: 'Distribuidora de energia', categoryId: 'energia', amountCents: 22000, dueDate: daysFromToday(0), recurring: true, origin: 'recorrente' }),
    e({ id: 'fe-gas', direction: 'payable', description: 'Gás', counterpart: 'Gás do Norte', categoryId: 'gas', amountCents: 14000, dueDate: daysFromToday(3), recurring: true, origin: 'recorrente' }),
    e({ id: 'fe-pc0049', direction: 'payable', description: 'Compra PC-0049', counterpart: 'Engenho Boa Vista', categoryId: 'compras', amountCents: 23540, dueDate: daysFromToday(-5), paidAt: daysFromToday(-5), paidAmountCents: 23540, accountId: 'banco', origin: 'compra', ref: 'pc-0049' }),
    e({ id: 'fe-cartao', direction: 'receivable', description: 'Cartões a liquidar', counterpart: 'Maquininha', categoryId: 'vendas', amountCents: 86000, dueDate: daysFromToday(2), origin: 'venda' }),
    e({ id: 'fe-fiado', direction: 'receivable', description: 'Fiado · Dona Lúcia', counterpart: 'Lúcia Andrade', categoryId: 'vendas', amountCents: 29000, dueDate: daysFromToday(5), origin: 'venda' }),
  ]
}
