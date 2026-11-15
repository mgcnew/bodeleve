import type { StockItem } from './inventory'

export type PaymentTermId = 'boleto14' | 'pix_on_delivery' | 'cash_on_delivery'

export const paymentTerms: Record<PaymentTermId, { label: string; dueDays: number | null }> = {
  boleto14: { label: 'Boleto, 14 dias após receber', dueDays: 14 },
  pix_on_delivery: { label: 'Pix na entrega', dueDays: 0 },
  cash_on_delivery: { label: 'Dinheiro na entrega', dueDays: 0 },
}

export type Supplier = {
  id: string
  name: string
  contactName: string
  phone: string
  email: string
  doc: string
  /** "Rapadura, melaço, açúcar" */
  supplies: string
  since: string
  defaultPayment: PaymentTermId
  leadTime: string
  /** Compras anteriores ao sistema, para o total do ano fechar com o que a casa já comprou. */
  previousPurchasesCents: number
}

export type PurchaseStatus = 'draft' | 'sent' | 'partially_received' | 'received' | 'cancelled'

export type PurchaseItem = {
  itemId: string
  /** Nome e medida como estavam no pedido ("Leite integral 1 L"). */
  name: string
  qty: number
  unitCostCents: number
  receivedQty: number
}

export type PurchaseOrder = {
  /** "PC-0057" */
  id: string
  supplierId: string
  status: PurchaseStatus
  createdAt: string
  sentAt: string | null
  expectedAt: string
  receivedAt: string | null
  payment: PaymentTermId
  items: PurchaseItem[]
  /** Encerrado com falta: aparece como "Recebido parcial". */
  closedShort: boolean
  /** `whatsapp` = foi enviado ao fornecedor; `registered_only` = só registrado no sistema (envio real depende de P8, D21). */
  sentVia: 'whatsapp' | 'registered_only'
}

export const orderTotal = (o: Pick<PurchaseOrder, 'items'>) => o.items.reduce((a, i) => a + i.qty * i.unitCostCents, 0)
export const receivedTotal = (o: Pick<PurchaseOrder, 'items'>) => o.items.reduce((a, i) => a + i.receivedQty * i.unitCostCents, 0)
export const isOpen = (o: Pick<PurchaseOrder, 'status'>) => o.status === 'sent' || o.status === 'partially_received' || o.status === 'draft'

export type ReceiptLine = { itemId: string; qty: number; lot: string; expiresAt: string | null }

export type ReceiptErrors = Record<string, { qty?: string; lot?: string; expiresAt?: string }>

/** Confere o que foi digitado no recebimento. As mensagens dizem como corrigir. */
export function validateReceipt(order: PurchaseOrder, lines: ReceiptLine[], items: StockItem[]): ReceiptErrors {
  const errors: ReceiptErrors = {}
  for (const l of lines) {
    const po = order.items.find((i) => i.itemId === l.itemId)
    if (!po) continue
    const e: ReceiptErrors[string] = {}
    const remaining = po.qty - po.receivedQty
    if (!Number.isFinite(l.qty) || l.qty < 0) e.qty = 'Informe um número igual ou maior que zero.'
    if (l.qty > 0) {
      if (l.lot.trim() === '') e.lot = 'Informe o lote como está na embalagem.'
      const needsExpiry = items.find((i) => i.id === l.itemId)?.tracksExpiry ?? false
      if (needsExpiry && !l.expiresAt) e.expiresAt = 'Informe a validade como está na embalagem.'
    }
    if (l.qty > remaining * 2 + 10) e.qty = 'A quantidade parece alta demais. Confira a nota.'
    if (Object.keys(e).length) errors[l.itemId] = e
  }
  return errors
}

/** "20/11/2026" -> ISO de meio-dia (evita virar o dia por fuso). Devolve null se a data não existe. */
export function parseBrDate(text: string): string | null {
  const m = text.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
  if (!m) return null
  const [d, mo, y] = [Number(m[1]), Number(m[2]), Number(m[3])]
  const date = new Date(y, mo - 1, d, 12)
  if (date.getFullYear() !== y || date.getMonth() !== mo - 1 || date.getDate() !== d) return null
  return date.toISOString()
}

export function formatBrDate(iso: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`
}

/** Sugestão de compra pelo estoque mínimo (H-G7, H-I23): no mínimo ou abaixo, repor até o dobro do mínimo; acima, nada. */
export function suggestQty(balance: number, min: number): number {
  if (balance > min) return 0
  return Math.max(min * 2 - balance, 1)
}

/** Texto do pedido ao fornecedor (H-G7). Nesta versão só é montado e guardado; o envio real depende de P8 (D21). */
export function purchaseMessage(supplier: Pick<Supplier, 'contactName'>, order: PurchaseOrder, paymentLabel: string): string {
  const lines = order.items.map((i) => `• ${i.qty} × ${i.name}`).join('\n')
  return `Olá, ${supplier.contactName}! Pedido ${order.id} da Bodeleve:\n${lines}\nPrevisão de chegada: ${formatBrDate(order.expectedAt)}\nPagamento: ${paymentLabel}.`
}
