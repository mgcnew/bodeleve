import type { Lot, StockItem, StockMovement } from '@/domain/inventory'
import type { PurchaseOrder, Supplier } from '@/domain/purchasing'
import type { Recipe, ProductionOrder } from '@/domain/production'
import type { Reservation } from '@/domain/stock'

/** Estoque, fornecedores e compras de EXEMPLO (quadros do lote 2). Datas relativas ao momento em que o banco simulado é criado. */

const at = (now: Date, plusDays: number, hour = 12) => {
  const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + plusDays, hour)
  return d.toISOString()
}

type Opening = { code: string; qty: number; expiresInDays: number | null; costCents: number }
type Spec = Omit<StockItem, 'lastCostCents'> & { lastCostCents: number | null; lots: Opening[] }

const withContent = (sp: Spec, qty: number, unit: string): Spec => ({ ...sp, content: { qty, unit } })

const item = (
  id: string, name: string, unit: string, itemType: StockItem['itemType'], origin: StockItem['origin'], categoryId: string,
  minStock: number, tracksExpiry: boolean, supplierId: string | null, lastCostCents: number | null, lots: Opening[],
): Spec => ({ id, name, unit, itemType, origin, categoryId, minStock, tracksExpiry, supplierId, lastCostCents, lots })

/**
 * Os números seguem o quadro Estoque: "disponível" (físico − reservado) e mínimo de cada item. O físico aqui já inclui o que está
 * reservado pelos pedidos online abertos da fila de exemplo, para o disponível fechar com o quadro (7 itens baixos, 3 vencendo).
 */
const specs: Spec[] = [
  // Feitos na casa (o queijo coalho tem histórico próprio, abaixo)
  item('queijo-coalho', 'Queijo coalho', '500 g', 'finished', 'house', 'laticinios', 15, true, null, 1420, []),
  item('queijo-manteiga', 'Queijo manteiga', '500 g', 'finished', 'house', 'laticinios', 5, true, null, 1680, [{ code: 'QM-1031', qty: 9, expiresInDays: 21, costCents: 1680 }]),
  item('doce-de-leite', 'Doce de leite', '400 g', 'finished', 'house', 'laticinios', 8, true, null, 790, [{ code: 'DL-1110', qty: 10, expiresInDays: 6, costCents: 790 }]),
  // Marca Bodeleve
  item('rapadura', 'Rapadura', '400 g', 'resale', 'brand', 'doces', 12, false, 'engenho', 780, [{ code: 'RP-1002', qty: 6, expiresInDays: null, costCents: 780 }]),
  item('manteiga-de-garrafa', 'Manteiga de garrafa', '200 ml', 'finished', 'brand', 'laticinios', 6, true, null, 1500, [{ code: 'MG-1020', qty: 13, expiresInDays: 40, costCents: 1500 }]),
  // Revenda
  item('carne-de-sol', 'Carne de sol', '500 g', 'resale', 'resale', 'carnes', 10, true, 'charqueada', 2800, [{ code: 'CS-0811', qty: 14, expiresInDays: 12, costCents: 2800 }]),
  item('charque', 'Charque', '500 g', 'resale', 'resale', 'carnes', 5, true, 'charqueada', 3260, [{ code: 'CH-0902', qty: 8, expiresInDays: 30, costCents: 3260 }]),
  item('requeijao', 'Requeijão', '250 g', 'resale', 'resale', 'laticinios', 10, true, 'serra', 680, [{ code: 'RQ-1109', qty: 14, expiresInDays: 9, costCents: 680 }]),
  item('nata', 'Nata', '200 g', 'resale', 'resale', 'laticinios', 6, true, 'serra', 520, [{ code: 'NT-1110', qty: 6, expiresInDays: 4, costCents: 520 }]),
  item('farinha-de-mandioca', 'Farinha de mandioca', '1 kg', 'resale', 'resale', 'farinhas', 12, false, 'moinho', 480, [{ code: 'FM-0921', qty: 31, expiresInDays: null, costCents: 480 }]),
  item('tapioca-granulada', 'Tapioca granulada', '500 g', 'resale', 'resale', 'farinhas', 10, false, 'moinho', 300, [{ code: 'TG-1030', qty: 4, expiresInDays: null, costCents: 300 }]),
  item('flocao-de-milho', 'Flocão de milho', '500 g', 'resale', 'resale', 'farinhas', 12, false, 'moinho', 250, [{ code: 'FL-0915', qty: 20, expiresInDays: null, costCents: 250 }]),
  item('fuba', 'Fubá', '500 g', 'resale', 'resale', 'farinhas', 10, false, 'moinho', 220, [{ code: 'FB-0916', qty: 15, expiresInDays: null, costCents: 220 }]),
  item('melaco-de-cana', 'Melaço de cana', '500 ml', 'resale', 'resale', 'doces', 6, false, 'engenho', 950, [{ code: 'ME-0910', qty: 6, expiresInDays: null, costCents: 950 }]),
  // Matérias-primas
  withContent(item('leite-integral', 'Leite integral', '1 L', 'raw_material', null, 'laticinios', 40, true, 'serra', 310, [{ code: 'LT-1100', qty: 18, expiresInDays: 10, costCents: 310 }]), 1, 'L'),
  withContent(item('coalho-liquido', 'Coalho líquido', '50 ml', 'raw_material', null, 'laticinios', 3, false, null, 1250, [{ code: 'CL-0905', qty: 1, expiresInDays: null, costCents: 1250 }]), 50, 'ml'),
  withContent(item('acucar-mascavo', 'Açúcar mascavo', '1 kg', 'raw_material', null, 'doces', 8, false, 'engenho', 820, [{ code: 'AM-0918', qty: 10, expiresInDays: null, costCents: 820 }]), 1, 'kg'),
  withContent(item('sal', 'Sal', '1 kg', 'raw_material', null, 'insumos', 2, false, null, 400, [{ code: 'SL-0801', qty: 3, expiresInDays: null, costCents: 400 }]), 1, 'kg'),
  item('embalagem-vacuo', 'Embalagem a vácuo', '', 'raw_material', null, 'insumos', 40, false, null, 80, [{ code: 'EV-0901', qty: 120, expiresInDays: null, costCents: 80 }]),
]

/** Reserva à mão (encomenda de um cliente, evento): somada às reservas dos pedidos online. */
export const reservationsSeed: Reservation[] = [{ id: 'rsv-1', itemId: 'queijo-coalho', qty: 3, ref: 'Encomenda de sábado' }]

export function buildStockSeed(now: Date): { items: StockItem[]; lots: Lot[]; movements: StockMovement[] } {
  const items: StockItem[] = []
  const lots: Lot[] = []
  const movements: StockMovement[] = []
  for (const sp of specs) {
    const { lots: openings, ...rest } = sp
    items.push(rest)
    openings.forEach((o, n) => {
      const lotId = `lot-${sp.id}-${n + 1}`
      lots.push({
        id: lotId, itemId: sp.id, code: o.code, expiresAt: o.expiresInDays == null ? null : at(now, o.expiresInDays),
        unitCostCents: o.costCents, receivedAt: at(now, -10), source: 'Inventário inicial',
      })
      movements.push({ id: `mv-open-${lotId}`, itemId: sp.id, lotId, type: 'inventory', qty: o.qty, at: at(now, -10), ref: 'Inventário inicial', description: 'Inventário inicial' })
    })
  }

  // Queijo coalho: histórico completo do quadro Movimentações. Saldo: 15 → 12 → 11 → 21 → 20 → 18.
  const l1 = 'lot-queijo-coalho-1'
  const l2 = 'lot-queijo-coalho-2'
  lots.push(
    { id: l1, itemId: 'queijo-coalho', code: 'QC-1107', expiresAt: at(now, 5), unitCostCents: 1420, receivedAt: at(now, -12), source: 'OP-0029' },
    { id: l2, itemId: 'queijo-coalho', code: 'QC-1112', expiresAt: at(now, 18), unitCostCents: 1420, receivedAt: at(now, -1, 17), source: 'OP-0031' },
  )
  const ago = (minutes: number) => new Date(now.getTime() - minutes * 60_000).toISOString()
  const mv = (id: string, lotId: string, type: StockMovement['type'], qty: number, atIso: string, ref: string, description: string, by?: string): StockMovement =>
    ({ id, itemId: 'queijo-coalho', lotId, type, qty, at: atIso, ref, description, ...(by ? { by } : {}) })
  movements.push(
    mv('mv-qc-1', l1, 'production_in', 15, at(now, -12), 'OP-0029', 'Produção · OP-0029 · Entrada do lote QC-1107'),
    mv('mv-qc-2', l1, 'sale_out', -3, at(now, -3, 16), 'V-0188', 'Venda no balcão'),
    mv('mv-qc-3', l1, 'loss', -1, at(now, -2, 18), 'Ajuste manual', 'Perda · embalagem danificada', 'Ana'),
    mv('mv-qc-4', l2, 'production_in', 10, at(now, -1, 17), 'OP-0031', 'Produção · OP-0031 · Entrada do lote QC-1112'),
    mv('mv-qc-5', l1, 'sale_out', -1, ago(230), 'V-1037', 'Venda online · pedido #1037'),
    mv('mv-qc-6', l1, 'sale_out', -2, ago(32), 'V-0212', 'Venda no balcão'),
  )
  return { items, lots, movements }
}

export const suppliersSeed: Supplier[] = [
  { id: 'engenho', name: 'Engenho Boa Vista', contactName: 'Seu Antônio', phone: '(00) 90000-0100', email: '[E-MAIL]', doc: '[CNPJ OU CPF]', supplies: 'Rapadura, melaço, açúcar', since: '2024', defaultPayment: 'boleto14', leadTime: '3 a 5 dias', previousPurchasesCents: 239760 },
  { id: 'serra', name: 'Laticínios Serra Verde', contactName: '[NOME DO CONTATO]', phone: '(00) 90000-0101', email: '[E-MAIL]', doc: '[CNPJ OU CPF]', supplies: 'Leite, requeijão, nata', since: '2025', defaultPayment: 'boleto14', leadTime: '1 a 2 dias', previousPurchasesCents: 0 },
  { id: 'moinho', name: 'Moinho Sertão', contactName: '[NOME DO CONTATO]', phone: '(00) 90000-0102', email: '[E-MAIL]', doc: '[CNPJ OU CPF]', supplies: 'Farinhas, tapioca, flocão', since: '2025', defaultPayment: 'boleto14', leadTime: '3 a 5 dias', previousPurchasesCents: 0 },
  { id: 'charqueada', name: 'Charqueada Norte', contactName: '[NOME DO CONTATO]', phone: '(00) 90000-0103', email: '[E-MAIL]', doc: '[CNPJ OU CPF]', supplies: 'Carne de sol, charque', since: '2025', defaultPayment: 'boleto14', leadTime: '4 a 6 dias', previousPurchasesCents: 0 },
]

const line = (itemId: string, name: string, qty: number, unitCostCents: number, receivedQty = 0) => ({ itemId, name, qty, unitCostCents, receivedQty })

/** Os cinco pedidos do quadro Compras mais dois do histórico do Engenho (quadro Fornecedor). */
export function buildPurchaseSeed(now: Date): PurchaseOrder[] {
  const base = (id: string, supplierId: string, status: PurchaseOrder['status'], items: PurchaseOrder['items'], o: Partial<PurchaseOrder> & { expectedAt: string }): PurchaseOrder => ({
    id, supplierId, status, createdAt: at(now, -3), sentAt: null, receivedAt: null, payment: 'boleto14', items, closedShort: false, sentVia: 'whatsapp', ...o,
  })
  return [
    base('PC-0057', 'serra', 'sent', [line('leite-integral', 'Leite integral 1 L', 140, 310), line('requeijao', 'Requeijão 250 g', 20, 680), line('nata', 'Nata 200 g', 12, 520)], { createdAt: at(now, -3), sentAt: at(now, -3), expectedAt: at(now, 0) }),
    base('PC-0056', 'moinho', 'sent', [line('farinha-de-mandioca', 'Farinha de mandioca 1 kg', 40, 480), line('tapioca-granulada', 'Tapioca granulada 500 g', 50, 300), line('flocao-de-milho', 'Flocão de milho 500 g', 40, 250), line('fuba', 'Fubá 500 g', 20, 220)], { sentAt: at(now, -2), expectedAt: at(now, 4) }),
    base('PC-0055', 'charqueada', 'sent', [line('carne-de-sol', 'Carne de sol 500 g', 14, 2800), line('charque', 'Charque 500 g', 10, 3260)], { sentAt: at(now, -1), expectedAt: at(now, 5) }),
    base('PC-0054', 'moinho', 'received', [line('farinha-de-mandioca', 'Farinha de mandioca 1 kg', 50, 480, 50), line('tapioca-granulada', 'Tapioca granulada 500 g', 40, 300, 40), line('flocao-de-milho', 'Flocão de milho 500 g', 40, 250, 40), line('fuba', 'Fubá 500 g', 20, 260, 20)], { sentAt: at(now, -12), expectedAt: at(now, -7), receivedAt: at(now, -7) }),
    // Recebido parcial: faltou a nata. Encerrado assim; o valor mostrado é o do que chegou (R$ 420,00).
    base('PC-0053', 'serra', 'received', [line('leite-integral', 'Leite integral 1 L', 100, 310, 100), line('requeijao', 'Requeijão 250 g', 20, 550, 20), line('nata', 'Nata 200 g', 12, 520, 0)], { sentAt: at(now, -17), expectedAt: at(now, -14), receivedAt: at(now, -14), closedShort: true }),
    // Totais do quadro Fornecedor: PC-0049 = R$ 236,40; PC-0038 = R$ 312,00.
    base('PC-0049', 'engenho', 'received', [line('rapadura', 'Rapadura 400 g', 24, 780, 24), line('acucar-mascavo', 'Açúcar mascavo 1 kg', 6, 820, 6)], { sentAt: at(now, -21), expectedAt: at(now, -17), receivedAt: at(now, -17) }),
    base('PC-0038', 'engenho', 'received', [line('rapadura', 'Rapadura 400 g', 40, 780, 40)], { sentAt: at(now, -55), expectedAt: at(now, -50), receivedAt: at(now, -50) }),
  ]
}



// ───────── Produção (lote 4) ─────────

const inDays = (now: Date, plus: number, hour: number) => new Date(now.getFullYear(), now.getMonth(), now.getDate() + plus, hour).toISOString()

/** Fichas técnicas de EXEMPLO. O custo por unidade fecha com o quadro: coalho R$ 14,20, manteiga R$ 16,80, doce R$ 7,90, garrafa R$ 15,00. */
export const recipesSeed: Recipe[] = [
  {
    id: 'ficha-queijo-coalho', itemId: 'queijo-coalho', yieldPerBatch: 10, batchLabel: 'fornada', shelfLifeDays: 20, lotPrefix: 'QC', overheadCents: 300,
    lines: [{ itemId: 'leite-integral', qtyPerBatch: 40 }, { itemId: 'coalho-liquido', qtyPerBatch: 0.4 }, { itemId: 'sal', qtyPerBatch: 0.5 }, { itemId: 'embalagem-vacuo', qtyPerBatch: 10 }],
    method: '[MODO DE PREPARO DA CASA]',
  },
  {
    id: 'ficha-queijo-manteiga', itemId: 'queijo-manteiga', yieldPerBatch: 6, batchLabel: 'fornada', shelfLifeDays: 25, lotPrefix: 'QM', overheadCents: 180,
    lines: [{ itemId: 'leite-integral', qtyPerBatch: 30 }, { itemId: 'sal', qtyPerBatch: 0.3 }, { itemId: 'embalagem-vacuo', qtyPerBatch: 6 }],
    method: '[MODO DE PREPARO DA CASA]',
  },
  {
    id: 'ficha-doce-de-leite', itemId: 'doce-de-leite', yieldPerBatch: 12, batchLabel: 'tacho', shelfLifeDays: 30, lotPrefix: 'DL', overheadCents: 480,
    lines: [{ itemId: 'leite-integral', qtyPerBatch: 18 }, { itemId: 'acucar-mascavo', qtyPerBatch: 3 }, { itemId: 'embalagem-vacuo', qtyPerBatch: 12 }],
    method: '[MODO DE PREPARO DA CASA]',
  },
  {
    id: 'ficha-manteiga-de-garrafa', itemId: 'manteiga-de-garrafa', yieldPerBatch: 24, batchLabel: 'lote', shelfLifeDays: 45, lotPrefix: 'MG', overheadCents: 3080,
    lines: [{ itemId: 'leite-integral', qtyPerBatch: 100 }, { itemId: 'embalagem-vacuo', qtyPerBatch: 24 }],
    method: '[MODO DE PREPARO DA CASA]',
  },
]

const base = (o: Partial<ProductionOrder> & Pick<ProductionOrder, 'id' | 'recipeId' | 'itemId' | 'batches' | 'plannedQty' | 'status' | 'startsAt'>): ProductionOrder => ({
  destination: { kind: 'stock' }, endsAt: null, startedAt: null, doneAt: null, goodQty: null, lotCode: null, expiresAt: null, costPerUnitCents: null, lotId: null, movementIds: [], reservationIds: [], ...o,
})

export function buildProductionSeed(now: Date): ProductionOrder[] {
  return [
    base({ id: 'OP-0032', recipeId: 'ficha-queijo-coalho', itemId: 'queijo-coalho', batches: 2, plannedQty: 20, status: 'in_progress', startsAt: inDays(now, 0, 9), startedAt: inDays(now, 0, 9), endsAt: inDays(now, 0, 18) }),
    base({ id: 'OP-0033', recipeId: 'ficha-doce-de-leite', itemId: 'doce-de-leite', batches: 1, plannedQty: 12, status: 'in_progress', startsAt: inDays(now, 0, 13), startedAt: inDays(now, 0, 13), endsAt: inDays(now, 1, 10) }),
    // Para o pedido #1041, que leva 1 queijo manteiga (o quadro cita #1045, número que a loja ainda vai gerar).
    base({ id: 'OP-0034', recipeId: 'ficha-queijo-manteiga', itemId: 'queijo-manteiga', batches: 1, plannedQty: 6, status: 'planned', startsAt: inDays(now, 1, 8), destination: { kind: 'order', orderId: '1041' } }),
    base({ id: 'OP-0035', recipeId: 'ficha-manteiga-de-garrafa', itemId: 'manteiga-de-garrafa', batches: 1, plannedQty: 24, status: 'planned', startsAt: inDays(now, 4, 8) }),
    base({ id: 'OP-0031', recipeId: 'ficha-queijo-coalho', itemId: 'queijo-coalho', batches: 1, plannedQty: 10, status: 'done', startsAt: inDays(now, -1, 9), startedAt: inDays(now, -1, 9), doneAt: inDays(now, -1, 17), goodQty: 10, lotCode: 'QC-1112', expiresAt: inDays(now, 18, 12), costPerUnitCents: 1420 }),
    base({ id: 'OP-0030', recipeId: 'ficha-doce-de-leite', itemId: 'doce-de-leite', batches: 1, plannedQty: 12, status: 'done', startsAt: inDays(now, -4, 9), startedAt: inDays(now, -4, 9), doneAt: inDays(now, -4, 17), goodQty: 11, lotCode: 'DL-1110', expiresAt: inDays(now, 6, 12), costPerUnitCents: 790 }),
  ]
}
