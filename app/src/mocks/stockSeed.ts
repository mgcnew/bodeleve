import type { Lot, StockItem, StockMovement } from '@/domain/inventory'
import type { PurchaseOrder, Supplier } from '@/domain/purchasing'

/** Estoque, fornecedores e compras de EXEMPLO (quadros do lote 2). Datas relativas ao momento em que o banco simulado é criado. */

const at = (now: Date, plusDays: number, hour = 12) => {
  const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + plusDays, hour)
  return d.toISOString()
}

type Opening = { code: string; qty: number; expiresInDays: number | null; costCents: number }
type Spec = Omit<StockItem, 'lastCostCents'> & { lastCostCents: number | null; lots: Opening[] }

const item = (
  id: string, name: string, unit: string, itemType: StockItem['itemType'], minStock: number, tracksExpiry: boolean,
  supplierId: string | null, lastCostCents: number | null, lots: Opening[],
): Spec => ({ id, name, unit, itemType, minStock, tracksExpiry, supplierId, lastCostCents, lots })

const specs: Spec[] = [
  // Feitos na casa
  item('queijo-coalho', 'Queijo coalho', '500 g', 'finished', 20, true, null, null, [
    { code: 'QC-1107', qty: 8, expiresInDays: 5, costCents: 2100 }, { code: 'QC-1112', qty: 10, expiresInDays: 18, costCents: 2100 },
  ]),
  item('queijo-manteiga', 'Queijo manteiga', '500 g', 'finished', 10, true, null, null, [{ code: 'QM-1031', qty: 15, expiresInDays: 21, costCents: 2400 }]),
  item('doce-de-leite', 'Doce de leite', '400 g', 'finished', 10, true, null, null, [{ code: 'DL-1101', qty: 12, expiresInDays: 6, costCents: 1100 }]),
  // Marca Bodeleve
  item('rapadura', 'Rapadura', '400 g', 'resale', 12, false, 'engenho', 780, [{ code: 'RP-1002', qty: 4, expiresInDays: null, costCents: 780 }]),
  item('manteiga-de-garrafa', 'Manteiga de garrafa', '200 ml', 'resale', 8, true, null, 1800, [{ code: 'MG-1020', qty: 11, expiresInDays: 40, costCents: 1800 }]),
  // Revenda
  item('carne-de-sol', 'Carne de sol', '500 g', 'resale', 8, true, 'charqueada', 2800, [{ code: 'CS-0811', qty: 10, expiresInDays: 12, costCents: 2800 }]),
  item('charque', 'Charque', '500 g', 'resale', 5, true, 'charqueada', 3260, [{ code: 'CH-0902', qty: 8, expiresInDays: 30, costCents: 3260 }]),
  item('requeijao', 'Requeijão', '250 g', 'resale', 10, true, 'serra', 680, [{ code: 'RQ-1109', qty: 14, expiresInDays: 9, costCents: 680 }]),
  item('nata', 'Nata', '200 g', 'resale', 10, true, 'serra', 520, [{ code: 'NT-1110', qty: 6, expiresInDays: 7, costCents: 520 }]),
  item('farinha-de-mandioca', 'Farinha de mandioca', '1 kg', 'resale', 20, false, 'moinho', 480, [{ code: 'FM-0921', qty: 30, expiresInDays: null, costCents: 480 }]),
  item('tapioca-granulada', 'Tapioca granulada', '500 g', 'resale', 12, false, 'moinho', 300, [{ code: 'TG-1030', qty: 3, expiresInDays: null, costCents: 300 }]),
  item('flocao-de-milho', 'Flocão de milho', '500 g', 'resale', 12, false, 'moinho', 250, [{ code: 'FL-0915', qty: 20, expiresInDays: null, costCents: 250 }]),
  item('fuba', 'Fubá', '500 g', 'resale', 10, false, 'moinho', 220, [{ code: 'FB-0916', qty: 15, expiresInDays: null, costCents: 220 }]),
  // Matérias-primas
  item('leite-integral', 'Leite integral', '1 L', 'raw_material', 60, true, 'serra', 310, [{ code: 'LT-1100', qty: 70, expiresInDays: 3, costCents: 310 }]),
  item('melaco-de-cana', 'Melaço de cana', '500 ml', 'raw_material', 6, false, 'engenho', 950, [{ code: 'ME-0910', qty: 6, expiresInDays: null, costCents: 950 }]),
  item('acucar-mascavo', 'Açúcar mascavo', '1 kg', 'raw_material', 8, false, 'engenho', 820, [{ code: 'AM-0918', qty: 10, expiresInDays: null, costCents: 820 }]),
]

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
      movements.push({ id: `mv-open-${lotId}`, itemId: sp.id, lotId, type: 'inventory', qty: o.qty, at: at(now, -10), ref: 'Inventário inicial' })
    })
  }
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

