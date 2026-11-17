// PDV no banco: caixa (`cash_sessions`, `cash_movements`) e vendas do balcão (`orders` com channel pos,
// `order_items`, `payments`). As telas leem `cashStore` e `salesStore`; com o Supabase ligado eles são
// caches alimentados aqui, e as ações chamam `pos_open_session`, `pos_checkout`, `pos_cancel_sale`,
// `pos_cash_movement`, `pos_close_session` e `pos_reopen_session`, que fazem a baixa pelo lote, o
// lançamento do dinheiro e a conferência da senha do gestor.
import type { CashSession, Payment, PayMethod, PosCart, Sale } from '@/domain/pdv'
import { supabase } from '@/lib/supabase'
import { itemsStore } from './gestao/backoffice'
import { getEstablishmentId, refreshBackoffice } from './gestao/backofficeRemote'
import { refreshFinance } from './gestao/financeRemote'
import { cashStore, salesStore } from './pdv'

type SessionRow = {
  id: string
  status: 'open' | 'closed'
  opened_at: string
  opened_by_name: string | null
  opening_cents: number
  closed_at: string | null
  counted_cents: number | null
  expected_cents: number | null
  cash_movements: { id: string; kind: 'sangria' | 'suprimento'; cents: number; reason: string; at: string }[]
}

type SaleRow = {
  id: string
  number: string
  status: string
  created_at: string
  created_by_name: string | null
  subtotal_cents: number
  discount_kind: string | null
  discount_cents: number | null
  discount_reason: string | null
  total_cents: number
  cancelled_at: string | null
  approved_by_name: string | null
  order_items: { product_id: string | null; name: string; kind: string | null; qty: number; unit_price_cents: number; total_cents: number; lots: { lotCode?: string; code?: string }[] | null }[]
  payments: { method: PayMethod; cents: number; received_cents: number | null }[]
}

const discountLabels: Record<string, string> = { p5: 'Desconto 5%', p10: 'Desconto 10%', f500: 'Desconto', round: 'Arredondamento' }
const discountKinds: Record<string, string> = { 'Desconto 5%': 'p5', 'Desconto 10%': 'p10', Desconto: 'f500', Arredondamento: 'round' }

function toSession(r: SessionRow): CashSession {
  return {
    id: r.id,
    openedAt: r.opened_at,
    openedBy: r.opened_by_name ?? 'Equipe',
    floatCents: Number(r.opening_cents),
    movements: [...r.cash_movements]
      .sort((a, b) => a.at.localeCompare(b.at))
      .map((m) => ({ id: m.id, kind: m.kind === 'sangria' ? 'withdrawal' : 'supply', cents: Number(m.cents), reason: m.reason, at: m.at })),
    closedAt: r.status === 'closed' ? r.closed_at : null,
    countedCents: r.status === 'closed' ? r.counted_cents : null,
    expectedCents: r.status === 'closed' ? r.expected_cents : null,
  }
}

function toSale(r: SaleRow): Sale {
  const slugOf = (productId: string | null) => itemsStore.get().find((i) => i.dbId === productId)?.id ?? productId ?? ''
  const cash = r.payments.filter((p) => p.method === 'cash')
  const sale: Sale = {
    id: r.id,
    number: r.number,
    at: r.created_at,
    by: r.created_by_name ?? 'Equipe',
    lines: r.order_items.map((i) => ({
      itemId: slugOf(i.product_id),
      name: i.name,
      // por peso, a quantidade do banco é em kg
      grams: i.kind === 'weight' ? Math.round(Number(i.qty) * 1000) : null,
      quantity: i.kind === 'weight' ? 1 : Number(i.qty),
      unitPriceCents: Number(i.unit_price_cents),
      totalCents: Number(i.total_cents),
      lotCode: i.lots?.[0]?.lotCode ?? i.lots?.[0]?.code ?? null,
    })),
    subtotalCents: Number(r.subtotal_cents),
    discountCents: Number(r.discount_cents ?? 0),
    discountLabel: r.discount_kind ? discountLabels[r.discount_kind] ?? 'Desconto' : null,
    discountReason: r.discount_reason,
    totalCents: Number(r.total_cents),
    payments: r.payments.map((p) => ({ method: p.method, cents: Number(p.cents), receivedCents: p.received_cents === null ? undefined : Number(p.received_cents) })),
    changeCents: cash.reduce((n, p) => n + Math.max(0, Number(p.received_cents ?? p.cents) - Number(p.cents)), 0),
    status: r.status === 'cancelled' ? 'cancelled' : 'done',
    cancelledAt: r.cancelled_at,
    cancelledBy: r.approved_by_name,
    effects: { movementIds: [], ledgerIds: [], entryIds: [] },
  }
  return sale
}

let loading: Promise<void> | null = null
let rerun: Promise<void> | null = null

export async function refreshPdv(): Promise<void> {
  if (!supabase) return
  if (loading) {
    rerun ??= loading.catch(() => undefined).then(() => {
      rerun = null
      return refreshPdv()
    })
    return rerun
  }
  loading = (async () => {
    const [sess, sales] = await Promise.all([
      supabase!.from('cash_sessions').select('id, status, opened_at, opened_by_name, opening_cents, closed_at, counted_cents, expected_cents, cash_movements(id, kind, cents, reason, at)').order('opened_at', { ascending: false }).limit(2),
      supabase!
        .from('orders')
        .select('id, number, status, created_at, created_by_name, subtotal_cents, discount_kind, discount_cents, discount_reason, total_cents, cancelled_at, approved_by_name, order_items(product_id, name, kind, qty, unit_price_cents, total_cents, lots), payments(method, cents, received_cents)')
        .eq('channel', 'pos')
        .order('created_at', { ascending: false })
        .limit(200),
    ])
    if (sess.error || !sess.data) return
    const rows = sess.data as unknown as SessionRow[]
    const latest = rows[0] ?? null
    const lastClosed = rows.find((r) => r.status === 'closed') ?? null
    cashStore.set({
      session: latest ? toSession(latest) : null,
      lastClose: lastClosed && lastClosed.closed_at ? { at: lastClosed.closed_at, diffCents: Number(lastClosed.counted_cents ?? 0) - Number(lastClosed.expected_cents ?? 0) } : null,
    })
    if (!sales.error && sales.data) salesStore.set((sales.data as unknown as SaleRow[]).map(toSale))
  })().finally(() => {
    loading = null
  })
  return loading
}

/** Mantém o caixa e as vendas em dia: busca ao abrir, a cada 20 s e quando o caixa ou os pedidos mudam (Realtime) */
export function startPdvSync() {
  if (!supabase) return () => undefined
  void refreshPdv()
  const timer = setInterval(() => void refreshPdv(), 20_000)
  const channel = supabase
    .channel(`pdv-caixa-${Math.random().toString(36).slice(2)}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'cash_sessions' }, () => void refreshPdv())
    .on('postgres_changes', { event: '*', schema: 'public', table: 'cash_movements' }, () => void refreshPdv())
    .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => void refreshPdv())
    .subscribe()
  return () => {
    clearInterval(timer)
    void supabase!.removeChannel(channel)
  }
}

async function rpc<T>(fn: string, args: Record<string, unknown>) {
  const { data, error } = await supabase!.rpc(fn, args)
  if (error) throw error
  await refreshPdv()
  return data as T
}

/** Venda e cancelamento mexem em estoque e dinheiro: atualiza também esses caches */
const refreshAfterSale = () => Promise.all([refreshBackoffice(), refreshFinance()])

export async function remoteOpenCash(floatCents: number) {
  await rpc<string>('pos_open_session', { p_establishment: await getEstablishmentId(), p_opening_cents: floatCents })
}

export async function remoteCloseCash(countedCents: number) {
  await rpc<unknown>('pos_close_session', { p_establishment: await getEstablishmentId(), p_counted_cents: countedCents })
  await refreshFinance()
}

export async function remoteReopenCash() {
  await rpc<string>('pos_reopen_session', { p_establishment: await getEstablishmentId() })
  await refreshFinance()
}

export async function remoteCashMovement(kind: 'withdrawal' | 'supply', cents: number, reason: string) {
  await rpc<unknown>('pos_cash_movement', { p_establishment: await getEstablishmentId(), p_kind: kind === 'withdrawal' ? 'sangria' : 'suprimento', p_cents: cents, p_reason: reason })
  await refreshFinance()
}

export async function remoteCheckout(cart: PosCart, payments: Payment[]): Promise<Sale> {
  const dbId = (slug: string) => {
    const id = itemsStore.get().find((i) => i.id === slug)?.dbId
    if (!id) throw new Error('unknown_product')
    return id
  }
  const lines = cart.lines.map((l) => (l.grams !== null ? { product_id: dbId(l.itemId), kind: 'weight', qty: l.grams / 1000 } : { product_id: dbId(l.itemId), kind: 'unit', qty: l.quantity }))
  const discount = cart.discount && cart.discount.cents > 0 ? { kind: discountKinds[cart.discount.label] ?? 'f500', reason: cart.discount.reason } : null
  const res = await rpc<{ order_id: string }>('pos_checkout', {
    p_establishment: await getEstablishmentId(),
    p_sale: { lines, discount, payments: payments.map((p) => ({ method: p.method, cents: p.cents, received_cents: p.receivedCents ?? null })) },
  })
  await refreshAfterSale()
  const sale = salesStore.get().find((s) => s.id === res.order_id)
  if (!sale) throw new Error('sale_not_found')
  return sale
}

/** Devolve `error` do banco como exceção, para a tela mostrar a mensagem certa */
export async function remoteCancelSale(orderId: string, pin: string) {
  const res = await rpc<{ ok?: boolean; error?: string; approved_by?: string }>('pos_cancel_sale', { p_order: orderId, p_pin: pin })
  if (res.error) throw new Error(res.error)
  await refreshAfterSale()
}

export function posErrorMessage(e: unknown) {
  const msg = String((e as { message?: string })?.message ?? '')
  if (msg.includes('no_session')) return 'Abra o caixa antes de continuar.'
  if (msg.includes('session_open')) return 'Já existe um caixa aberto.'
  if (msg.includes('insufficient_stock')) return 'Falta estoque de um dos itens. Tire-o da sacola ou ajuste o estoque.'
  if (msg.includes('invalid_pin')) return 'Senha do gestor incorreta.'
  if (msg.includes('pin_locked')) return 'Muitas tentativas erradas. Aguarde 10 minutos.'
  if (msg.includes('already_cancelled')) return 'Esta venda já foi cancelada.'
  if (msg.includes('invalid_amount')) return 'Valor inválido. A retirada não pode passar do dinheiro que há no caixa.'
  if (msg.includes('invalid_payment')) return 'O pagamento não fecha com o total da venda.'
  if (msg.includes('forbidden')) return 'Seu papel não permite esta ação.'
  return 'Não foi possível concluir. Nada foi alterado. Tente de novo.'
}
