/** Contas a pagar e a receber (H-G9, H-G24). O módulo Financeiro (lote 5) amplia isto; aqui só o que Compras precisa. */
export type FinancialEntry = {
  id: string
  direction: 'payable' | 'receivable'
  description: string
  amountCents: number
  dueAt: string
  paidAt: string | null
  origin: 'purchase' | 'sale' | 'manual'
  /** Documento de origem: "PC-0057". */
  ref: string
  supplierId: string | null
}
