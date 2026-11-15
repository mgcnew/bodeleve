import type { IconName } from '@/components'
import type { AreaCheck, Category, HomeSection, Order, OrderItem, PlaceOrderInput, Product, StoreContent } from '@/domain/types'
import type { StockLevel } from '@/domain/inventory'
import type { PaymentTermId, PurchaseOrder, ReceiptLine, Supplier } from '@/domain/purchasing'
import type { ReceiveResult } from '@/domain/receiving'
import type { Role } from '@/permissions'

/**
 * Contratos que as telas usam. Hoje têm implementação simulada (src/mocks); quando o Supabase for conectado (D19),
 * outra implementação entra no lugar sem mexer nas telas.
 */
export interface CatalogService {
  listCategories(): Promise<Category[]>
  /** Catálogo público: não exige login (D5). */
  listProducts(filter?: { categoryId?: string; origin?: Product['origin']; query?: string }): Promise<Product[]>
  getProduct(id: string): Promise<Product | null>
  getHomeSections(): Promise<HomeSection[]>
}

export interface OrderService {
  /** O servidor refaz os preços e o total: o cliente nunca manda valor. */
  placeOrder(input: PlaceOrderInput): Promise<Order>
  /** Pedidos feitos neste aparelho (H-L12) ou, com conta, todos os da conta. */
  listOrders(): Promise<Order[]>
  getOrder(id: string): Promise<Order | null>
}

export type Session = { phone: string }

export interface AuthService {
  /** H-L10: código de 4 dígitos por WhatsApp. O envio real depende de P8; o mock não envia nada. */
  requestCode(phone: string): Promise<void>
  verifyCode(phone: string, code: string): Promise<Session>
}

export interface AreaService {
  /** H-L9: valida o CEP contra a área de entrega (Q6). */
  checkCep(cep: string): Promise<AreaCheck>
}

export interface ContentService {
  getStoreContent(): Promise<StoreContent>
}

// ───────────────────────── Gestão ─────────────────────────

export type AdminUser = { id: string; name: string; email: string; role: Role }

export interface AdminAuthService {
  /** E-mail e senha da equipe (H-G1). Lança `invalid_credentials`. */
  signIn(email: string, password: string): Promise<AdminUser>
}

export type OrderLot = { code: string; expiresAt: string | null }
export type AdminOrderItem = OrderItem & { lot: OrderLot | null }
export type AdminOrder = Omit<Order, 'items'> & {
  items: AdminOrderItem[]
  customerSince: string | null
  customerOrderCount: number
}

export interface AdminOrderService {
  /** Pedidos em aberto (novos, em preparo, prontos e em rota). */
  listOpen(): Promise<AdminOrder[]>
  get(id: string): Promise<AdminOrder | null>
  /** Novo → Em preparo (H-G4). */
  accept(id: string): Promise<AdminOrder>
  /** Em preparo → Pronto. Exige todos os itens conferidos. Lança `items_not_checked`. */
  markReady(id: string, checkedProductIds: string[]): Promise<AdminOrder>
  /** Pronto → Em preparo. */
  undoReady(id: string): Promise<AdminOrder>
}

export type DashboardAlert = { id: string; icon: IconName; title: string; detail: string; href: string }

export type Dashboard = {
  salesToday: {
    totalCents: number
    count: number
    yesterdayUntilNowCents: number
    counter: { count: number; cents: number }
    online: { count: number; cents: number }
  }
  /** "Pede ação hoje" (H-G2). */
  attention: DashboardAlert[]
  today: {
    openOrders: { count: number; newCount: number; preparingCount: number }
    inProduction: { count: number; detail: string }
    payableToday: { cents: number; count: number }
    receivableWeek: { cents: number; detail: string }
  }
}

export interface DashboardService {
  get(): Promise<Dashboard>
}

export type PurchaseView = Omit<PurchaseOrder, 'items'> & {
  /** `tracksExpiry`: o item tem validade, então o recebimento pede a data (H-G8). */
  items: Array<PurchaseOrder['items'][number] & { tracksExpiry: boolean }>
  supplierName: string
  totalCents: number
  receivedCents: number
  itemCount: number
}

export type SupplierView = Supplier & {
  openOrders: number
  arrivingToday: number
  lastPurchaseAt: string | null
  purchasedThisYearCents: number
  openPayablesCents: number
  products: Array<{ itemId: string; name: string; lastCostCents: number | null }>
  recentOrders: Array<{ id: string; receivedAt: string; totalCents: number }>
}

export type PurchaseSuggestion = {
  itemId: string
  name: string
  balance: number
  min: number
  level: StockLevel
  lastCostCents: number
  suggestedQty: number
}

export type SendPurchaseInput = { supplierId: string; expectedAt: string; payment: PaymentTermId; items: Array<{ itemId: string; qty: number }> }

export interface PurchasingService {
  listOrders(): Promise<PurchaseView[]>
  getOrder(id: string): Promise<PurchaseView | null>
  listSuppliers(): Promise<SupplierView[]>
  getSupplier(id: string): Promise<SupplierView | null>
  /** Itens do fornecedor com estoque, mínimo e quantidade sugerida (H-G7). */
  suggest(supplierId: string): Promise<PurchaseSuggestion[]>
  /** Salva como "Enviado" e monta a mensagem. Nesta versão a mensagem NÃO é enviada (D21): fica no registro. */
  send(input: SendPurchaseInput): Promise<{ order: PurchaseView; message: string }>
  /** Lança `invalid_lines` (com `errors`), `invalid_state` ou `not_found`. */
  receive(id: string, input: { lines: ReceiptLine[]; closeShort: boolean }): Promise<ReceiveResult & { order: PurchaseView }>
  /** Encerra o pedido que ficou com falta ("Encerrar o pedido assim"). */
  closeShort(id: string): Promise<PurchaseView>
  /** Corrige a conferência do último recebimento. Lança `cannot_reverse` se já houve saída do lote ou pagamento. */
  reverseReceipt(id: string): Promise<PurchaseView>
}

export type AdminServices = {
  auth: AdminAuthService
  orders: AdminOrderService
  dashboard: DashboardService
  purchasing: PurchasingService
}

export type Services = {
  catalog: CatalogService
  orders: OrderService
  auth: AuthService
  area: AreaService
  content: ContentService
  admin: AdminServices
}
