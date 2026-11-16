import { DeliveryError } from '@/domain/deliveries'
import { FinanceError, accountName, type PayInput } from '@/domain/finance'
import { itemBalance, itemLabel } from '@/domain/inventory'
import { PosError, type PosSale } from '@/domain/pos'
import { ProductionError, formatContent } from '@/domain/production'
import { paymentTerms, purchaseMessage, validateReceipt, type PaymentTermId, type ReceiptErrors } from '@/domain/purchasing'
import { ReceivingError } from '@/domain/receiving'
import { validateCourier, validateRecipe, validateSupplier } from '@/domain/registry'
import { createAdminServices } from '@/mocks/adminServices'
import { createDb as createMemoryDb } from '@/mocks/db'
import type { AdminServices, CheckoutInput, Dashboard } from '@/services/types'
import { ServiceError, unwrap } from '../client'
import type { AdminContext } from './context'
import { hydrate, type Registry } from './hydrate'

type Hydrated = Pick<AdminServices, 'stock' | 'purchasing' | 'production' | 'finance' | 'dashboard' | 'deliveries' | 'pos' | 'reports'>

const FRESH_MS = 1500
const payLabel: Record<PaymentTermId, string> = { boleto14: 'Boleto', pix_on_delivery: 'Pix', cash_on_delivery: 'Dinheiro' }
const addDays = (days: number) => new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate() + days, 12).toISOString()

/**
 * Estoque, Compras, Produção e Financeiro sobre o Supabase.
 * Leitura: carrega o estado da casa do banco e deixa as mesmas regras e visões do app montarem a tela.
 * Escrita: chama a função do banco (que confere o papel e grava tudo de uma vez) e recarrega.
 */
export function createHydratedAdmin(ctx: AdminContext): Hydrated {
  const { client } = ctx
  const memory = createMemoryDb({ storage: null, withSeed: false, now: () => new Date() })
  const view = createAdminServices({ db: memory, now: () => new Date() })

  let loaded: { at: number; reg: Promise<Registry> } | null = null
  // Último estado que chegou do banco: sem conexão (balcão, entregas) as telas seguem com ele em vez de falhar.
  let last: Registry | null = null
  const fresh = (): Promise<Registry> => {
    if (!loaded || Date.now() - loaded.at > FRESH_MS) {
      const reg = hydrate(ctx)
        .then((r) => {
          last = r
          memory.update((s) => Object.assign(s, r.state))
          return r
        })
        .catch((e) => {
          if (last) return last
          throw e
        })
      loaded = { at: Date.now(), reg }
      reg.catch(() => {
        if (loaded?.reg === reg) loaded = null
      })
    }
    return loaded.reg
  }
  const refresh = () => {
    loaded = null
    return fresh()
  }

  /** Lê com o estado do banco e entrega para a visão simulada. */
  const read = <A extends unknown[], R>(f: (...a: A) => Promise<R>) => async (...a: A): Promise<R> => {
    await fresh()
    return f(...a)
  }
  const rpc = async <T = unknown>(fn: string, args: Record<string, unknown>): Promise<T> => unwrap(await client.rpc(fn as never, args as never)) as T
  const est = () => ctx.establishment()

  /** Erros do banco → os mesmos erros que as telas já tratam. */
  const asProduction = (e: unknown, reg?: Registry): never => {
    if (!(e instanceof ServiceError)) throw e
    const c = e.code
    if (c === 'insufficient_input') throw new ProductionError('insufficient', reg?.state.stockItems.find((i) => i.name === e.detail)?.id ?? e.detail)
    if (c === 'not_found') throw new ProductionError('not_found')
    if (c === 'invalid_state' || c === 'already_done' || c === 'not_done') throw new ProductionError('invalid_state')
    if (c === 'lot_already_used') throw new ProductionError('cannot_reverse')
    throw new ProductionError('invalid_input', e.detail)
  }
  const asFinance = (e: unknown): never => {
    if (!(e instanceof ServiceError)) throw e
    const known = ['not_found', 'invalid_amount', 'insufficient_balance', 'already_paid', 'cannot_reverse'] as const
    throw new FinanceError((known as readonly string[]).includes(e.code) ? (e.code as (typeof known)[number]) : 'invalid_amount', e.detail)
  }
  const asReceiving = (e: unknown): never => {
    if (!(e instanceof ServiceError)) throw e
    if (e.code === 'not_found') throw new ReceivingError('not_found')
    if (e.code === 'not_receivable' || e.code === 'invalid_state') throw new ReceivingError('invalid_state')
    if (['not_last_receipt', 'lot_already_used', 'entry_already_paid', 'already_undone'].includes(e.code)) throw new ReceivingError('cannot_reverse')
    throw new ReceivingError('invalid_lines')
  }


  // ───────── Balcão ─────────
  const QUEUE = 'bodeleve.pos.queue.v1'
  type Queued = { input: CheckoutInput; by: string }
  const readQueue = (): Queued[] => {
    try {
      return JSON.parse(localStorage.getItem(QUEUE) ?? '[]') as Queued[]
    } catch {
      return []
    }
  }
  const writeQueue = (q: Queued[]) => {
    try {
      localStorage.setItem(QUEUE, JSON.stringify(q))
    } catch {
      /* sem armazenamento: a venda da fila se perde ao recarregar */
    }
  }
  /** Vendas feitas sem conexão, ainda só neste aparelho. */
  const localSales = new Map<string, PosSale>()
  let offlineSeq = 0

  const asPos = (e: unknown): never => {
    if (!(e instanceof ServiceError)) throw e
    const known = ['empty_cart', 'insufficient_stock', 'invalid_payment', 'unknown_product', 'session_closed', 'not_found', 'already_cancelled', 'invalid_pin', 'invalid_amount', 'invalid_qty', 'no_session'] as const
    if (e.code === 'invalid_discount') throw new PosError('invalid_payment')
    throw new PosError((known as readonly string[]).includes(e.code) ? (e.code as (typeof known)[number]) : 'invalid_payment', e.detail)
  }
  const payload = (input: CheckoutInput) => ({
    lines: input.lines.map((l) => ({ product_id: l.itemId, kind: l.kind, qty: l.qty })),
    discount: input.discount,
    payments: input.payments.map((p) => ({ method: p.method, cents: p.cents, received_cents: p.receivedCents ?? null })),
    offline: input.offline ?? false,
  })

  function createPos(): AdminServices['pos'] {
    return {
      overview: async () => {
        await fresh()
        const o = await view.pos.overview()
        return { ...o, pendingSales: readQueue().length }
      },
      catalog: read(() => view.pos.catalog()),
      sales: read((f?: 'all' | 'cash' | 'pix' | 'card') => view.pos.sales(f)),
      cash: read(() => view.pos.cash()),
      async getSale(id) {
        const local = localSales.get(id)
        if (local) return local
        await fresh()
        return view.pos.getSale(id)
      },
      async openSession(openingCents) {
        try {
          await rpc('pos_open_session', { p_establishment: await est(), p_opening_cents: openingCents })
        } catch (e) {
          if (e instanceof ServiceError && e.code === 'session_open') throw new Error('session_open')
          return asPos(e)
        }
        await refresh()
        return (await view.pos.overview()).session!
      },
      async checkout(input, by) {
        const offline = input.offline || (typeof navigator !== 'undefined' && navigator.onLine === false)
        if (offline) {
          // Sem conexão: a venda sai pelas regras do app com o último estado conhecido e fica na fila deste aparelho até a conexão voltar (H-I89).
          if (!last) throw new PosError('no_session')
          const sale = await view.pos.checkout({ ...input, offline: true }, by)
          const local: PosSale = { ...sale, id: `OFF-${(offlineSeq += 1)}`, pending: true }
          localSales.set(local.id, local)
          writeQueue([...readQueue(), { input: { ...input, offline: true }, by }])
          return local
        }
        let r: { number: string }
        try {
          r = await rpc('pos_checkout', { p_establishment: await est(), p_sale: payload({ ...input, offline: false }) })
        } catch (e) {
          return asPos(e)
        }
        await refresh()
        return (await view.pos.getSale(r.number))!
      },
      async cancelSale(id, pin) {
        const reg = await fresh()
        let r: { ok?: boolean; error?: string }
        try {
          r = await rpc('pos_cancel_sale', { p_order: reg.posOrderId.get(id), p_pin: pin })
        } catch (e) {
          return asPos(e)
        }
        if (r.error) throw new PosError('invalid_pin', r.error)
        await refresh()
        return (await view.pos.getSale(id))!
      },
      async addMovement(kind, cents, reason) {
        try {
          await rpc('pos_cash_movement', { p_establishment: await est(), p_kind: kind, p_cents: cents, p_reason: reason })
        } catch (e) {
          return asPos(e)
        }
        await refresh()
        return (await view.pos.cash())!
      },
      async closeSession(countedCents) {
        try {
          await rpc('pos_close_session', { p_establishment: await est(), p_counted_cents: countedCents })
        } catch (e) {
          return asPos(e)
        }
        await refresh()
        return (await view.pos.cash())!
      },
      async reopenSession() {
        try {
          await rpc('pos_reopen_session', { p_establishment: await est() })
        } catch (e) {
          if (e instanceof ServiceError && e.code === 'session_open') throw new Error('session_open')
          return asPos(e)
        }
        await refresh()
        return (await view.pos.cash())!
      },
      async sendReceipt(saleId, phone) {
        const reg = await fresh()
        // D21: o comprovante fica guardado na caixa de saída; nenhuma mensagem sai.
        await rpc('pos_send_receipt', { p_order: reg.posOrderId.get(saleId), p_phone: phone })
      },
      /** Envia as vendas feitas sem conexão. O que o banco recusar de vez (produto que deixou de existir) fica na fila. */
      async syncPending() {
        const queue = readQueue()
        const kept: Queued[] = []
        let sent = 0
        for (const q of queue) {
          try {
            await rpc('pos_checkout', { p_establishment: await est(), p_sale: payload({ ...q.input, offline: true }) })
            sent += 1
          } catch {
            kept.push(q)
          }
        }
        writeQueue(kept)
        if (sent > 0) {
          localSales.clear()
          await refresh()
        }
        return sent
      },
    }
  }

  return {
    deliveries: {
      overview: async () => {
        // Entrega publicada que ninguém aceitou no prazo volta para a casa (H-I71).
        await rpc('delivery_expire_published', { p_establishment: await est() }).catch(() => 0)
        await refresh()
        return view.deliveries.overview()
      },
      getAssign: read((id: string) => view.deliveries.getAssign(id)),
      async assign(orderNumber, optionId) {
        const reg = await fresh()
        try {
          const order = reg.orderId.get(orderNumber)
          if (!order) throw new DeliveryError('not_found')
          await rpc('delivery_assign', { p_order: order, p_courier: optionId === 'partners' ? null : optionId })
        } catch (e) {
          if (e instanceof ServiceError && ['not_found', 'not_ready', 'already_assigned'].includes(e.code)) throw new DeliveryError(e.code as 'not_found')
          throw e
        }
        await refresh()
        const current = (await view.deliveries.getAssign(orderNumber))?.current
        return { title: current?.title ?? '', summary: current?.summary ?? '' }
      },
      async undoAssign(orderNumber) {
        const reg = await fresh()
        try {
          await rpc('delivery_unassign', { p_order: reg.orderId.get(orderNumber) })
        } catch (e) {
          if (e instanceof ServiceError) throw new DeliveryError(e.code === 'no_assignment' ? 'no_assignment' : 'not_found')
          throw e
        }
        await refresh()
      },
      getCourier: read((id: string) => view.deliveries.getCourier(id)),
      async saveCourier(id, input) {
        if (Object.keys(validateCourier(input)).length) throw new Error('invalid')
        const row = { name: input.name.trim(), kind: input.kind, phone: input.phone.trim(), vehicle: input.vehicle.trim() }
        let savedId = id ?? ''
        const { data, error } = id
          ? await client.from('couriers').update(row).eq('id', id).select('id').single()
          : await client.from('couriers').insert({ establishment_id: await est(), ...row }).select('id').single()
        if (error) throw new Error(error.code === '23505' ? 'duplicate' : error.message)
        savedId = data.id
        await refresh()
        const rows = (await view.deliveries.overview()).couriers
        return rows.find((r) => r.id === savedId) ?? { id: savedId, name: row.name, initial: row.name.charAt(0), detail: 'Parceiro · avulso', tag: { label: 'Parceiro', tone: 'neutral' as const } }
      },
    },


    pos: createPos(),
    reports: { hub: read(() => view.reports.hub()), sales: read((p: Parameters<AdminServices['reports']['sales']>[0]) => view.reports.sales(p)) },
    dashboard: { get: read((): Promise<Dashboard> => view.dashboard.get()) },

    stock: {
      overview: read(() => view.stock.overview()),
      getItem: read((id: string) => view.stock.getItem(id)),
      movements: read((id: string) => view.stock.movements(id)),
      countAreas: read(() => view.stock.countAreas()),
      countItems: read((id: string) => view.stock.countItems(id)),
      async adjust(input) {
        const reg = await fresh()
        const lot = reg.state.lots.find((l) => l.id === input.lotId)
        const item = reg.state.stockItems.find((i) => i.id === input.itemId)
        if (!lot || !item) throw new Error('not_found')
        const before = itemBalance(reg.state.movements, input.itemId)
        const movementId = await rpc<string>('stock_adjust', { p_product: input.itemId, p_lot: input.lotId, p_qty: input.qty, p_kind: input.kind, p_reason: input.reason, p_add: input.add ?? false })
        await refresh()
        return { movementId, costCents: Math.round(input.qty * lot.unitCostCents), physicalBefore: before, physicalAfter: Math.round((before + (input.add ? input.qty : -input.qty)) * 1000) / 1000, lotCode: lot.code, itemName: itemLabel(item) }
      },
      async undoMovement(movementId) {
        await rpc('stock_reverse', { p_movement: movementId })
        await refresh()
      },
      async applyCount(lines) {
        const r = await rpc<{ count_id: string; changed_products: number; delta_units: number }>('stock_count_apply', {
          p_establishment: await est(), p_lines: lines.map((l) => ({ product_id: l.itemId, counted: l.counted })),
        })
        const reg = await refresh()
        const lotCost = new Map(reg.state.lots.map((l) => [l.id, l.unitCostCents]))
        const delta = reg.state.movements.filter((m) => m.batchId === r.count_id).reduce((a, m) => a + Math.round(m.qty * (m.lotId ? lotCost.get(m.lotId) ?? 0 : 0)), 0)
        return { batchId: r.changed_products > 0 ? r.count_id : null, adjustments: r.changed_products, deltaUnits: Number(r.delta_units), deltaCostCents: delta }
      },
      async undoCount(batchId) {
        await rpc('stock_count_undo', { p_count: batchId })
        await refresh()
      },
    },

    purchasing: {
      listOrders: read(() => view.purchasing.listOrders()),
      getOrder: read((id: string) => view.purchasing.getOrder(id)),
      listSuppliers: read(() => view.purchasing.listSuppliers()),
      getSupplier: read((id: string) => view.purchasing.getSupplier(id)),
      suggest: read((id: string) => view.purchasing.suggest(id)),
      async saveSupplier(id, input) {
        if (Object.keys(validateSupplier(input)).length) throw new Error('invalid')
        const row = {
          name: input.name.trim(), supplies: input.supplies.trim(), contact_name: input.contactName.trim(), phone: input.phone.trim() || null, email: input.email.trim() || null,
          tax_id: input.doc.trim() || null, payment_terms: input.defaultPayment, lead_time_days: input.leadTimeDays,
        }
        let savedId = id ?? ''
        if (id) {
          const { error } = await client.from('suppliers').update(row).eq('id', id)
          if (error) throw new Error(error.message)
        } else {
          const { data, error } = await client.from('suppliers').insert({ establishment_id: await est(), ...row }).select('id').single()
          if (error) throw new Error(error.message)
          savedId = data.id
        }
        await refresh()
        return (await view.purchasing.getSupplier(savedId))!
      },
      async send(input) {
        const reg = await fresh()
        const supplier = reg.state.suppliers.find((s) => s.id === input.supplierId)
        const lines = input.items.filter((i) => i.qty > 0)
        if (!supplier) throw new Error('not_found')
        if (lines.length === 0) throw new Error('empty_order')
        // D21: a mensagem é montada e guardada, não enviada. O banco troca {number} pelo número do pedido.
        const items = lines.map((l) => {
          const it = reg.state.stockItems.find((x) => x.id === l.itemId)
          if (!it) throw new Error('not_found')
          return { itemId: it.id, name: itemLabel(it), qty: l.qty, unitCostCents: it.lastCostCents ?? 0, receivedQty: 0 }
        })
        const draft = { id: '{number}', supplierId: supplier.id, status: 'sent' as const, createdAt: '', sentAt: null, expectedAt: input.expectedAt, receivedAt: null, payment: input.payment, items, closedShort: false, sentVia: 'registered_only' as const }
        const template = purchaseMessage(supplier, draft, paymentTerms[input.payment].label)
        const created = await rpc<{ id: string; number: string }>('create_purchase_order', {
          p_establishment: await est(), p_supplier: input.supplierId, p_expected: input.expectedAt, p_payment: input.payment,
          p_items: lines.map((l) => ({ product_id: l.itemId, qty: l.qty })), p_message: template,
        })
        await refresh()
        return { order: (await view.purchasing.getOrder(created.number))!, message: template.replaceAll('{number}', created.number) }
      },
      async receive(id, input) {
        const reg = await fresh()
        const order = reg.state.purchaseOrders.find((o) => o.id === id)
        if (!order) throw new ReceivingError('not_found')
        if (order.status !== 'sent' && order.status !== 'partially_received') throw new ReceivingError('invalid_state')
        const errors: ReceiptErrors = validateReceipt(order, input.lines, reg.state.stockItems)
        for (const l of input.lines) {
          const po = order.items.find((i) => i.itemId === l.itemId)
          if (po && l.qty > po.qty - po.receivedQty && !errors[l.itemId]?.qty) errors[l.itemId] = { ...errors[l.itemId], qty: 'A quantidade passa do que falta receber. Confira a nota.' }
        }
        if (Object.keys(errors).length) throw new ReceivingError('invalid_lines', errors)
        const lines = input.lines.filter((l) => l.qty > 0).map((l) => ({ item_id: reg.poItemId.get(`${id}:${l.itemId}`), qty: l.qty, lot: l.lot.trim(), expires_at: l.expiresAt }))
        let r: { receipt_id: string; total_cents: number; entry_id: string; closed: boolean }
        try {
          r = await rpc('receive_purchase', {
            p_po: reg.poId.get(id), p_lines: lines, p_close_short: input.closeShort,
            p_due_at: addDays(paymentTerms[order.payment].dueDays ?? 0), p_payment_label: payLabel[order.payment],
          })
        } catch (e) {
          return asReceiving(e)
        }
        const after = await refresh()
        const po = after.state.purchaseOrders.find((o) => o.id === id)!
        const receipt = after.state.receipts.find((x) => x.id === r.receipt_id)
        const entered = (receipt?.lotIds ?? []).flatMap((lotId) => {
          const lot = after.state.lots.find((x) => x.id === lotId)
          const item = lot && after.state.stockItems.find((x) => x.id === lot.itemId)
          const qty = after.state.movements.filter((m) => m.lotId === lotId && m.type === 'purchase_in').reduce((a, m) => a + m.qty, 0)
          return lot && item ? [{ itemId: item.id, itemName: itemLabel(item), lotCode: lot.code, expiresAt: lot.expiresAt, qty }] : []
        })
        const entry = after.state.entries.find((e) => e.id === r.entry_id)
        const shortfall = po.status === 'received' ? po.items.filter((i) => i.receivedQty < i.qty).map((i) => ({ itemId: i.itemId, name: i.name, missing: i.qty - i.receivedQty })) : []
        return {
          order: (await view.purchasing.getOrder(id))!,
          entered, payable: entry ? { description: entry.description, amountCents: entry.amountCents, dueAt: entry.dueAt } : null, shortfall,
        } as never
      },
      async closeShort(id) {
        const reg = await fresh()
        try {
          await rpc('close_purchase_short', { p_po: reg.poId.get(id) })
        } catch (e) {
          return asReceiving(e)
        }
        await refresh()
        return (await view.purchasing.getOrder(id))!
      },
      async reverseReceipt(id) {
        const reg = await fresh()
        const last = reg.receiptsByPo.get(id)?.[0]
        if (!last) throw new ReceivingError('cannot_reverse')
        try {
          await rpc('undo_receipt', { p_receipt: last })
        } catch (e) {
          return asReceiving(e)
        }
        await refresh()
        return (await view.purchasing.getOrder(id))!
      },
    },

    production: {
      listOrders: read(() => view.production.listOrders()),
      getOrder: read((id: string) => view.production.getOrder(id)),
      listRecipes: read(() => view.production.listRecipes()),
      getRecipe: read((id: string) => view.production.getRecipe(id)),
      recipeOptions: read(() => view.production.recipeOptions()),
      async saveRecipe(id, input) {
        if (Object.keys(validateRecipe(input)).length) throw new Error('invalid')
        let savedId: string
        try {
          savedId = await rpc<string>('save_recipe', {
            p_establishment: await est(), p_recipe: id,
            p_data: {
              product_id: input.itemId, yield_per_batch: input.yieldPerBatch, batch_label: input.batchLabel, shelf_life_days: input.shelfLifeDays, lot_prefix: input.lotPrefix,
              overhead_cents: input.overheadCents, method: input.method, lines: input.lines.filter((l) => l.itemId).map((l) => ({ product_id: l.itemId, qty_per_batch: l.qtyPerBatch })),
            },
          })
        } catch (e) {
          if (e instanceof ServiceError && ['invalid_input', 'invalid_product', 'empty_recipe'].includes(e.code)) throw new Error('invalid')
          throw e
        }
        await refresh()
        return (await view.production.getRecipe(savedId))!
      },
      check: read((id: string, n: number) => view.production.check(id, n)),
      finishDefaults: read((id: string) => view.production.finishDefaults(id)),
      async createOrder(input) {
        const reg = await fresh()
        let r: { id: string; number: string; reserved: Array<{ product_id: string; qty: number }> }
        try {
          const dest = input.destination.kind === 'order' ? reg.orderId.get(input.destination.orderId) : null
          if (input.destination.kind === 'order' && !dest) throw new ProductionError('invalid_input', 'order')
          r = await rpc('create_production_order', { p_establishment: await est(), p_recipe: input.recipeId, p_batches: input.batches, p_destination: dest, p_starts_at: input.startsAt, p_start_now: input.startNow ?? false })
        } catch (e) {
          return asProduction(e, reg)
        }
        const after = await refresh()
        const parts = r.reserved.flatMap((x) => {
          const it = after.state.stockItems.find((i) => i.id === x.product_id)
          return it ? [`${formatContent(Number(x.qty), it)} de ${it.name.toLowerCase()}`] : []
        })
        const reservedText = parts.length > 1 ? `${parts.slice(0, -1).join(', ')} e ${parts[parts.length - 1]}` : parts[0] ?? ''
        return { order: (await view.production.getOrder(r.number))!, reservedText }
      },
      async undoCreate(id) {
        const reg = await fresh()
        try {
          await rpc('delete_production_order', { p_order: reg.opId.get(id) })
        } catch (e) {
          return asProduction(e, reg)
        }
        await refresh()
      },
      async start(id) {
        const reg = await fresh()
        try {
          await rpc('start_production', { p_order: reg.opId.get(id) })
        } catch (e) {
          return asProduction(e, reg)
        }
        await refresh()
        return (await view.production.getOrder(id))!
      },
      async finish(id, input) {
        const reg = await fresh()
        let r: { cost_per_unit_cents: number }
        try {
          r = await rpc('finish_production', {
            p_order: reg.opId.get(id), p_good_qty: input.goodQty, p_lot_code: input.lotCode, p_expires_at: input.expiresAt,
            p_consumption: input.consumption.map((c) => ({ product_id: c.itemId, qty: c.qty })),
          })
        } catch (e) {
          return asProduction(e, reg)
        }
        const after = await refresh()
        const order = (await view.production.getOrder(id))!
        const item = after.state.stockItems.find((x) => x.id === order.itemId)!
        return {
          order,
          entered: { itemName: itemLabel(item), lotCode: order.lotCode ?? '', expiresAt: order.expiresAt, qty: order.goodQty ?? 0 },
          consumed: input.consumption.filter((c) => c.qty > 0).flatMap((c) => {
            const it = after.state.stockItems.find((x) => x.id === c.itemId)
            return it ? [{ name: it.name, qtyText: formatContent(c.qty, it) }] : []
          }),
          lossQty: order.plannedQty - (order.goodQty ?? 0),
          costPerUnitCents: Number(r.cost_per_unit_cents),
        }
      },
      async undoFinish(id) {
        const reg = await fresh()
        try {
          await rpc('undo_finish_production', { p_order: reg.opId.get(id) })
        } catch (e) {
          return asProduction(e, reg)
        }
        await refresh()
        return (await view.production.getOrder(id))!
      },
    },

    finance: {
      overview: read(() => view.finance.overview()),
      entries: read(() => view.finance.entries()),
      getEntry: read((id: string) => view.finance.getEntry(id)),
      ledger: read(() => view.finance.ledger()),
      async pay(id, input: PayInput) {
        let r: { transaction_id: string; balance_after: number; next_entry_id: string | null }
        try {
          r = await rpc('pay_entry', { p_entry: id, p_amount_cents: input.amountCents, p_fine_cents: input.fineCents, p_account: input.accountId, p_method: input.method, p_paid_at: input.paidAt })
        } catch (e) {
          return asFinance(e)
        }
        await refresh()
        const entry = (await view.finance.getEntry(id))!.entry
        const next = r.next_entry_id ? (await view.finance.getEntry(r.next_entry_id))?.entry ?? null : null
        return { entry, accountName: accountName[input.accountId], balanceAfter: Number(r.balance_after), next, transactionId: r.transaction_id }
      },
      async undoPay(transactionId) {
        try {
          await rpc('undo_payment', { p_transaction: transactionId })
        } catch (e) {
          return asFinance(e)
        }
        await refresh()
      },
    },
  }
}
