import type { Courier, DeliveryStatus } from '@/domain/deliveries'
import type { History } from '@/domain/courierApp'
import type { CartLine, DiscountKind, Payment, PosSale } from '@/domain/pos'
import type { House, TeamMember } from '@/domain/settings'
import type { Hub, Period, SalesReport } from '@/domain/reports'
import type { Assignment, AssignOption, CourierRow, DispatchRow } from '@/domain/deliveries'
import type { ProductInput, ProductKind } from '@/domain/catalog'
import type { CustomerDetail, CustomerSummary } from '@/domain/customers'
import type { IconName } from '@/components'
import type { AreaCheck, Category, HomeSection, Order, OrderItem, PlaceOrderInput, Product, StoreContent } from '@/domain/types'
import type { StockLevel } from '@/domain/inventory'
import type { AdjustKind, StockRow } from '@/domain/stock'
import type { Destination, ProductionOrder } from '@/domain/production'
import type { AccountId, ForecastRow, LedgerRow, PayInput, Standing } from '@/domain/finance'
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

// ───────── Estoque ─────────

export type StockOverview = { lowCount: number; expiringCount: number; valueCents: number; rows: StockRow[] }

export type StockLotView = { id: string; code: string; expiresAt: string | null; balance: number; daysLeft: number | null; isNext: boolean }

export type StockItemView = StockRow & {
  unit: string
  /** Custo da última entrada (produção ou compra). */
  unitCostCents: number | null
  priceCents: number | null
  /** Na loja online: publicado ou não; `null` se o item não é vendido (matéria-prima). */
  published: boolean | null
  reservedOrders: number
  reservedManual: number
  lots: StockLotView[]
  /** Ordens de produção em andamento deste item (entram no projetado). */
  producing: Array<{ id: string; qty: number; endsAt: string | null }>
}

export type MovementView = { id: string; description: string; at: string; lotCode: string | null; by: string | null; qty: number; balanceAfter: number; reversed: boolean; reversalOf: string | null }

export type AdjustInput = { itemId: string; lotId: string; qty: number; kind: AdjustKind; reason: string; add?: boolean; by: string }

export type CountArea = { id: string; name: string; count: number }
export type CountItem = { itemId: string; name: string; system: number; unitCostCents: number }

export interface StockService {
  overview(): Promise<StockOverview>
  getItem(id: string): Promise<StockItemView | null>
  /** Mais recentes primeiro, cada uma com o saldo do item depois dela. */
  movements(itemId: string): Promise<{ name: string; physical: number; rows: MovementView[] } | null>
  /** Lança perda, consumo interno ou correção. Lança `insufficient` se o lote não tem o que saiu. */
  adjust(input: AdjustInput): Promise<{ movementId: string; costCents: number; physicalBefore: number; physicalAfter: number; lotCode: string; itemName: string }>
  /** Desfaz com um lançamento contrário (o histórico fica). */
  undoMovement(movementId: string, by: string): Promise<void>
  countAreas(): Promise<CountArea[]>
  countItems(areaId: string): Promise<CountItem[]>
  applyCount(lines: Array<{ itemId: string; counted: number }>, by: string): Promise<{ batchId: string | null; adjustments: number; deltaUnits: number; deltaCostCents: number }>
  undoCount(batchId: string, by: string): Promise<void>
}

// ───────── Produção ─────────

export type RecipeView = {
  id: string
  itemId: string
  name: string
  itemType: StockItemView['itemType']
  origin: StockItemView['origin']
  yieldPerBatch: number
  batchLabel: string
  shelfLifeDays: number
  unitCostCents: number
  batchCostCents: number
  priceCents: number | null
  marginPercent: number | null
  overheadCents: number
  method: string
  lotPrefix: string
  lines: Array<{ itemId: string; name: string; qtyText: string; costCents: number }>
}

export type InputCheckView = {
  lines: Array<{ itemId: string; name: string; needText: string; haveText: string; missingText: string; missing: number; incomingToday: number }>
  missingAny: boolean
  coveredByIncoming: boolean
}

export type ProductionOrderView = ProductionOrder & { itemName: string; batchLabel: string }

export type FinishDefaults = {
  plannedQty: number
  costPlannedCents: number
  suggestedLot: string
  suggestedExpiresAt: string
  /** Em unidades da medida (L, ml, kg, un). `perUnit` converte para unidades de estoque. */
  consumption: Array<{ itemId: string; name: string; unit: string; planned: number; perUnit: number; step: number; decimals: number; unitCostCents: number }>
  overheadCents: number
}

export type FinishResult = {
  order: ProductionOrderView
  entered: { itemName: string; lotCode: string; expiresAt: string | null; qty: number }
  consumed: Array<{ name: string; qtyText: string }>
  lossQty: number
  costPerUnitCents: number
}

export type CreateOrderInput = { recipeId: string; batches: number; destination: Destination; startsAt: string; startNow?: boolean }

export interface ProductionService {
  listOrders(): Promise<ProductionOrderView[]>
  getOrder(id: string): Promise<ProductionOrderView | null>
  listRecipes(): Promise<RecipeView[]>
  getRecipe(id: string): Promise<RecipeView | null>
  /** H-G17: confere os insumos para N fornadas. */
  check(recipeId: string, batches: number): Promise<InputCheckView>
  /** Cria a ordem e reserva os insumos que há. Pedidos abertos da loja podem ser o destino. */
  createOrder(input: CreateOrderInput): Promise<{ order: ProductionOrderView; reservedText: string }>
  /** Desfaz uma ordem que ainda não começou (devolve a reserva). */
  undoCreate(id: string): Promise<void>
  start(id: string): Promise<ProductionOrderView>
  finishDefaults(id: string): Promise<FinishDefaults | null>
  /** Lança `insufficient` (com o item em `detail`) ou `invalid_input`. */
  finish(id: string, input: { consumption: Array<{ itemId: string; qty: number }>; goodQty: number; lotCode: string; expiresAt: string | null }): Promise<FinishResult>
  undoFinish(id: string): Promise<ProductionOrderView>
}

// ───────── Financeiro ─────────

export type AccountView = { id: AccountId; name: string; balanceCents: number }

export type EntryView = {
  id: string
  direction: 'payable' | 'receivable'
  title: string
  /** "Despesa fixa · venceu 10/11", "Boleto · compra PC-0054 · 21/11". */
  detail: string
  amountCents: number
  remainingCents: number
  dueAt: string
  standing: Standing
  daysLate: number
  /** "Atrasado", "Vence hoje", "Criada hoje", "Fiado" ou nada. */
  tag: { label: string; tone: 'error' | 'warning' | 'info' | 'neutral' } | null
  ref: string
  recurring: boolean
  paid: boolean
}

export type FinanceAttention = { id: string; title: string; detail: string; amountCents: number; tag: 'Atrasado' | 'Vence hoje'; href: string }

export type FinanceOverview = {
  totalCents: number
  accounts: AccountView[]
  attention: FinanceAttention[]
  forecast: { rows: ForecastRow[]; finalBalance: number; finalLabel: string | null }
}

export type PayResult = { entry: EntryView; accountName: string; balanceAfter: number; next: EntryView | null; transactionId: string }

export interface FinanceService {
  overview(): Promise<FinanceOverview>
  entries(): Promise<{ payables: EntryView[]; receivables: EntryView[]; payableTotalCents: number; receivableTotalCents: number }>
  getEntry(id: string): Promise<{ entry: EntryView; accounts: AccountView[] } | null>
  /** Lança `insufficient_balance` (com o saldo da conta em `detail`), `invalid_amount` ou `already_paid`. */
  pay(id: string, input: PayInput): Promise<PayResult>
  /** Desfaz com um lançamento contrário. */
  undoPay(transactionId: string): Promise<void>
  ledger(): Promise<{ rows: LedgerRow[]; inCents: number; outCents: number }>
}

export type ProductRow = {
  id: string
  /** "Queijo coalho 500 g" */
  label: string
  kind: ProductKind
  channel: string
  priceCents: number | null
  soldByWeight: boolean
}

export type ProductDetail = ProductInput & {
  id: string
  label: string
  unit: string
  costCents: number | null
  /** De onde vem o custo: a ficha técnica (feito na casa) ou o último recebimento. */
  costSource: 'recipe' | 'last_purchase' | null
  categories: Array<{ id: string; name: string }>
}

export type CategoryRow = { id: string; name: string; products: number; tag: 'Na loja' | 'Nova' }

export interface CatalogAdminService {
  list(): Promise<ProductRow[]>
  get(id: string): Promise<ProductDetail | null>
  /** Lança `invalid` se o formulário não passa na validação. */
  save(id: string, input: ProductInput): Promise<ProductDetail>
  /** Produto novo. A medida no fim do nome vira a embalagem. Lança `invalid` se o formulário não passa na validação. */
  create(input: ProductInput): Promise<ProductDetail>
  categories(): Promise<CategoryRow[]>
  /** Lança `empty` ou `duplicate`. */
  addCategory(name: string): Promise<CategoryRow>
}

export interface CustomerAdminService {
  list(query?: string): Promise<CustomerSummary[]>
  get(id: string): Promise<CustomerDetail | null>
  saveNotes(id: string, notes: string): Promise<void>
}

export type CourierView = CourierRow
export type DeliveriesOverview = { rows: DispatchRow[]; couriers: CourierRow[] }

export type AssignView = {
  orderId: string
  customer: string
  statusLabel: string
  address: string
  /** "4,1 km · 6 itens · pago no Pix" */
  summary: string
  ready: boolean
  options: AssignOption[]
  current: (Assignment & { optionId: string }) | null
}

export interface DeliveryAdminService {
  overview(): Promise<DeliveriesOverview>
  getAssign(orderId: string): Promise<AssignView | null>
  /** Lança `not_found`, `not_ready` ou `already_assigned`. */
  assign(orderId: string, optionId: string): Promise<Assignment>
  undoAssign(orderId: string): Promise<void>
}

export type SalesReportView = Omit<SalesReport, 'top'> & { top: Array<{ productId: string; name: string; qty: number }> }

export type ReportsHub = Omit<Hub, 'bestSeller'> & { bestSeller: { name: string; qty: number } | null }

export interface ReportsService {
  hub(): Promise<ReportsHub>
  sales(period: Period): Promise<SalesReportView>
}

export type SettingsOverview = { people: number; roles: number; deliveryFeeCents: number; paymentLabels: string[] }

export interface SettingsService {
  overview(): Promise<SettingsOverview>
  getHouse(): Promise<House>
  /** Lança `invalid` se nome, CNPJ ou WhatsApp não passam na validação. */
  saveHouse(house: House): Promise<House>
  team(): Promise<TeamMember[]>
  /** Lança `invalid_email`, `invalid_role` ou `duplicate`. O convite é só registrado: nenhum e-mail sai (D21). */
  invite(email: string, role: Role): Promise<TeamMember>
}

export type PosSessionView = { id: string; openedBy: string; openedAt: string; status: 'open' | 'closed'; openingCents: number; closedAt: string | null }

export type PosOverview = {
  session: PosSessionView | null
  /** Último caixa fechado: "13/11 · sem diferença". */
  lastClose: { at: string; differenceCents: number } | null
  /** Vendas feitas sem conexão que ainda não foram enviadas. */
  pendingSales: number
}

export type PosProduct = {
  id: string
  name: string
  unit: string
  /** Preço mostrado: do kg nos produtos por peso, da embalagem nos demais. */
  priceCents: number
  perKg: boolean
  /** "12 un", "6,4 kg". */
  stockText: string
  low: boolean
  out: boolean
  categoryId: string
  favorite: boolean
  availableUnits: number
}

export type PosCatalog = { products: PosProduct[]; categories: Array<{ id: string; name: string }> }

export type CheckoutInput = {
  lines: CartLine[]
  discount: { kind: DiscountKind; reason: string } | null
  payments: Payment[]
  /** A venda foi feita sem conexão: fica marcada como não enviada até a conexão voltar. */
  offline?: boolean
}

export type PosSaleRow = { id: string; at: string; items: number; methods: string; totalCents: number; cancelled: boolean; pending: boolean; filters: Array<'cash' | 'pix' | 'card'> }
export type PosSalesView = { rows: PosSaleRow[]; count: number; totalCents: number; session: PosSessionView | null }

export type CashView = {
  session: PosSessionView
  count: number
  cashCents: number
  pixCents: number
  cardCents: number
  totalCents: number
  salesCashCents: number
  movements: Array<{ id: string; label: string; signedCents: number }>
  expectedCents: number
  countedCents: number | null
  differenceCents: number | null
}

export interface PosService {
  overview(): Promise<PosOverview>
  /** Lança `session_open` se já há caixa aberto. */
  openSession(openingCents: number, by: string): Promise<PosSessionView>
  catalog(): Promise<PosCatalog>
  /** Lança PosError: `no_session`, `empty_cart`, `insufficient_stock`, `invalid_payment`, `unknown_product`. */
  checkout(input: CheckoutInput, by: string): Promise<PosSale>
  sales(filter?: 'all' | 'cash' | 'pix' | 'card'): Promise<PosSalesView>
  getSale(id: string): Promise<PosSale | null>
  /** Cancelamento precisa da senha de um gestor. Lança `invalid_pin` ou `already_cancelled`. */
  cancelSale(id: string, pin: string): Promise<PosSale>
  cash(): Promise<CashView | null>
  addMovement(kind: 'sangria' | 'suprimento', cents: number, reason: string, by: string): Promise<CashView>
  closeSession(countedCents: number, by: string): Promise<CashView>
  /** Reabre o último caixa fechado para corrigir. */
  reopenSession(): Promise<CashView>
  /** O comprovante é só registrado: nenhuma mensagem sai (D21). */
  sendReceipt(saleId: string, phone: string): Promise<void>
  /** Marca como enviadas as vendas feitas sem conexão. */
  syncPending(): Promise<number>
}

export type CourierCardView = {
  orderId: string
  district: string
  street: string
  /** "4,1 km" */
  km: string | null
  items: number
  /** Etiqueta do cartão: "Para você", "Em rota"… */
  tag: string
  /** Frase abaixo: "Ainda sem entregador. Você pode pegar." */
  detail: string
  valueLabel: string
  value: string
  /** `free` = livre para pegar; `published` = publicada para parceiros; o resto é dela ou dele. */
  state: 'free' | 'published' | DeliveryStatus
}

export type CourierList = { profile: Courier; available: CourierCardView[]; mine: CourierCardView[] }

export type CourierDetail = {
  orderId: string
  customer: string
  phone: string
  state: 'free' | 'published' | DeliveryStatus
  /** Etapa de 1 a 4; 0 = encerrada. */
  stage: 0 | 1 | 2 | 3 | 4
  storeAddress: string
  street: string
  district: string
  reference: string
  km: string | null
  minutes: number | null
  items: number
  /** "Pago no Pix. Nada a cobrar." / "Cobrar R$ 63,70 em dinheiro." */
  payLine: string
  cashDueCents: number
  /** Valor da entrega para parceiro; `null` para entregador da casa. */
  partnerFeeCents: number | null
  /** Quando saiu da loja (em rota) ou quando terminou. */
  at: string | null
  problemReason: string | null
  mapsUrl: string
}

export type CourierHistory = History & { courierName: string }

export interface CourierService {
  /** O código vai por WhatsApp (D21: não é enviado; em desenvolvimento aparece na tela). Lança `unknown_phone`. */
  requestCode(phone: string): Promise<void>
  /** Lança `unknown_phone` ou `invalid_code`. */
  verify(phone: string, code: string): Promise<Courier>
  profile(id: string): Promise<Courier | null>
  setAvailable(id: string, available: boolean): Promise<Courier>
  savePix(id: string, key: string): Promise<Courier>
  list(id: string): Promise<CourierList>
  get(id: string, orderId: string): Promise<CourierDetail | null>
  /** "Pegar esta entrega" (da casa) ou "Aceitar" a publicada (parceiro): passa a ser dele ou dela. */
  take(id: string, orderId: string): Promise<CourierDetail>
  /** Aceite da etapa 1. */
  accept(id: string, orderId: string): Promise<CourierDetail>
  /** "Saí da loja". */
  depart(id: string, orderId: string): Promise<CourierDetail>
  /** Lança `wrong_code` se o código não confere. */
  confirm(id: string, orderId: string, code: string): Promise<CourierDetail>
  problem(id: string, orderId: string, reason: string, note: string): Promise<CourierDetail>
  undoProblem(id: string, orderId: string): Promise<CourierDetail>
  history(id: string): Promise<CourierHistory>
}

export type AdminServices = {
  auth: AdminAuthService
  orders: AdminOrderService
  dashboard: DashboardService
  purchasing: PurchasingService
  stock: StockService
  production: ProductionService
  finance: FinanceService
  catalog: CatalogAdminService
  customers: CustomerAdminService
  deliveries: DeliveryAdminService
  reports: ReportsService
  settings: SettingsService
  pos: PosService
  courier: CourierService
}

/** O que mudou. Quem escuta atualiza só as telas desse assunto (hoje a raiz do app atualiza tudo). */
export type RealtimeTopic = 'orders' | 'deliveries' | 'stock' | 'cash'

/**
 * Atualização ao vivo (pedidos novos na gestão, status do pedido, entregas disponíveis, saldo no balcão).
 * Aqui é simulada (outro aba ou aparelho gravando no mesmo armazenamento); com o Supabase vira canais Realtime por tabela.
 */
export interface RealtimeService {
  onChange(listener: (topics: RealtimeTopic[]) => void): () => void
}

export type Services = {
  catalog: CatalogService
  orders: OrderService
  auth: AuthService
  area: AreaService
  content: ContentService
  admin: AdminServices
  realtime: RealtimeService
}
