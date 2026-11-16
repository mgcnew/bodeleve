import { createBrowserRouter, type RouteObject } from 'react-router-dom'
import { ButtonLink, EmptyState } from '@/components'
import { Gallery } from '@/gallery/Gallery'
import { LojaLayout, type LojaHandle } from '@/ui/loja/LojaLayout'
import { AboutPage } from '@/pages/loja/AboutPage'
import { AddressPage } from '@/pages/loja/AddressPage'
import { BagPage } from '@/pages/loja/BagPage'
import { BrandPage } from '@/pages/loja/BrandPage'
import { CategoryPage } from '@/pages/loja/CategoryPage'
import { ConfirmedPage } from '@/pages/loja/ConfirmedPage'
import { DeliveryPage } from '@/pages/loja/DeliveryPage'
import { HomePage } from '@/pages/loja/HomePage'
import { IdentificationPage } from '@/pages/loja/IdentificationPage'
import { LoginPage } from '@/pages/loja/LoginPage'
import { OrderPage } from '@/pages/loja/OrderPage'
import { OrdersPage } from '@/pages/loja/OrdersPage'
import { PaymentPage } from '@/pages/loja/PaymentPage'
import { ProductPage } from '@/pages/loja/ProductPage'
import { ProfilePage } from '@/pages/loja/ProfilePage'
import { ReviewPage } from '@/pages/loja/ReviewPage'
import { SearchPage } from '@/pages/loja/SearchPage'
import { GestaoLayout, type GestaoHandle } from '@/ui/gestao/GestaoLayout'
import { DashboardPage } from '@/pages/gestao/DashboardPage'
import { AdminLoginPage } from '@/pages/gestao/LoginPage'
import { ModulePlaceholder } from '@/pages/gestao/ModulePlaceholder'
import { MorePage } from '@/pages/gestao/MorePage'
import { AdminOrderPage } from '@/pages/gestao/OrderPage'
import { AdminOrdersPage } from '@/pages/gestao/OrdersPage'
import { AccountsPage, FinancePage, LedgerPage } from '@/pages/gestao/finance'
import { CategoriesPage, ProductPage as AdminProductPage, ProductsPage } from '@/pages/gestao/products'
import { CustomerPage, CustomersPage } from '@/pages/gestao/customers'
import { AssignPage, DeliveriesPage } from '@/pages/gestao/deliveries'
import { ReportsPage, SalesReportPage } from '@/pages/gestao/reports'
import { HousePage, SettingsPage, TeamPage } from '@/pages/gestao/settings'
import { PdvLayout, type PdvHandle } from '@/ui/pdv/PdvLayout'
import { BagPage as PdvBagPage, OpeningPage, PdvHome, SellPage } from '@/pages/pdv/sell'
import { DonePage, PaymentPage as PdvPaymentPage, SplitPage } from '@/pages/pdv/checkout'
import { CashPage, SalePage, SalesPage } from '@/pages/pdv/desk'
import { EntregasLayout, type EntregasHandle } from '@/ui/entregas/EntregasLayout'
import { CourierLoginPage } from '@/pages/entregas/login'
import { CourierListPage } from '@/pages/entregas/list'
import { DetailPage as CourierDetailPage, HandoverPage, PickupPage, ProblemPage, RoutePage } from '@/pages/entregas/flow'
import { HistoryPage, ProfilePage as CourierProfilePage } from '@/pages/entregas/me'
import { PayPage } from '@/pages/gestao/PayPage'
import { NewPurchasePage } from '@/pages/gestao/NewPurchasePage'
import { PurchasePage } from '@/pages/gestao/PurchasePage'
import { PurchasesPage } from '@/pages/gestao/purchasing'
import { ReceivingPage } from '@/pages/gestao/ReceivingPage'
import { SupplierPage, SuppliersPage } from '@/pages/gestao/suppliers'
import { ProductionOrderPage } from '@/pages/gestao/ProductionOrderPage'
import { RecipePage } from '@/pages/gestao/RecipePage'
import { ProductionPage, RecipesPage } from '@/pages/gestao/production'
import { StockAdjustPage } from '@/pages/gestao/StockAdjustPage'
import { StockCountPage } from '@/pages/gestao/StockCountPage'
import { StockMovementsPage } from '@/pages/gestao/StockMovementsPage'
import { StockItemPage, StockPage } from '@/pages/gestao/stock'
import { AppRoot } from './AppRoot'
import s from '@/ui/loja/loja.module.css'

const g = (module: GestaoHandle['module'], tabs = false): GestaoHandle => ({ module, tabs })
const tabs: LojaHandle = { tabs: true }
const tabsAndBag: LojaHandle = { tabs: true, bagBar: true }

function NotFound() {
  return (
    <main className={s.centerBox}>
      <EmptyState icon="buscar" title="Página não encontrada" description="O endereço pode ter mudado. Volte para o início." action={<ButtonLink href="/">Ir para o início</ButtonLink>} />
    </main>
  )
}

/**
 * Rotas da loja (Etapa 3). `handle` diz o que a moldura mostra: abas, barra da sacola.
 * Gestão, PDV e Entregas entram nas próximas etapas.
 */
export const routes: RouteObject[] = [
  {
    element: <AppRoot />,
    children: [
      { path: 'design-system', element: <Gallery /> },
      { path: 'gestao/entrar', element: <AdminLoginPage /> },
      {
        path: 'gestao',
        element: <GestaoLayout />,
        children: [
          { index: true, element: <DashboardPage />, handle: g('dashboard', true) },
          { path: 'pedidos', element: <AdminOrdersPage />, handle: g('orders', true) },
          { path: 'pedidos/:id', element: <AdminOrderPage />, handle: g('orders') },
          { path: 'mais', element: <MorePage />, handle: { tabs: true } satisfies GestaoHandle },
          { path: 'estoque', element: <StockPage />, handle: g('stock', true) },
          { path: 'estoque/contagem', element: <StockCountPage />, handle: g('stock') },
          { path: 'estoque/ajuste', element: <StockAdjustPage />, handle: g('stock') },
          { path: 'estoque/:id', element: <StockItemPage />, handle: g('stock') },
          { path: 'estoque/:id/movimentacoes', element: <StockMovementsPage />, handle: g('stock') },
          { path: 'estoque/:id/ajuste', element: <StockAdjustPage />, handle: g('stock') },
          { path: 'financeiro', element: <FinancePage />, handle: g('finance', true) },
          { path: 'financeiro/contas', element: <AccountsPage />, handle: g('finance') },
          { path: 'financeiro/pagar/:id', element: <PayPage />, handle: g('finance') },
          { path: 'financeiro/lancamentos', element: <LedgerPage />, handle: g('finance') },
          { path: 'compras', element: <PurchasesPage />, handle: g('purchasing') },
          { path: 'compras/novo', element: <NewPurchasePage />, handle: g('purchasing') },
          { path: 'compras/:id', element: <PurchasePage />, handle: g('purchasing') },
          { path: 'compras/:id/receber', element: <ReceivingPage />, handle: g('purchasing') },
          { path: 'fornecedores', element: <SuppliersPage />, handle: g('purchasing') },
          { path: 'fornecedores/:id', element: <SupplierPage />, handle: g('purchasing') },
          { path: 'producao', element: <ProductionPage />, handle: g('production') },
          { path: 'producao/fichas', element: <RecipesPage />, handle: g('production') },
          { path: 'producao/fichas/:id', element: <RecipePage />, handle: g('production') },
          { path: 'producao/ordens/:id', element: <ProductionOrderPage />, handle: g('production') },
          { path: 'produtos', element: <ProductsPage />, handle: g('stock') },
          { path: 'produtos/categorias', element: <CategoriesPage />, handle: g('stock') },
          { path: 'produtos/:id', element: <AdminProductPage />, handle: g('stock') },
          { path: 'clientes', element: <CustomersPage />, handle: g('orders') },
          { path: 'clientes/:id', element: <CustomerPage />, handle: g('orders') },
          { path: 'entregas', element: <DeliveriesPage />, handle: g('deliveries') },
          { path: 'entregas/atribuir/:id', element: <AssignPage />, handle: g('deliveries') },
          { path: 'relatorios', element: <ReportsPage />, handle: g('dashboard') },
          { path: 'relatorios/vendas', element: <SalesReportPage />, handle: g('dashboard') },
          { path: 'configuracoes', element: <SettingsPage />, handle: g('team') },
          { path: 'configuracoes/casa', element: <HousePage />, handle: g('team') },
          { path: 'configuracoes/equipe', element: <TeamPage />, handle: g('team') },
          { path: '*', element: <ModulePlaceholder /> },
        ],
      },
      {
        path: 'pdv',
        element: <PdvLayout />,
        children: [
          { index: true, element: <PdvHome /> },
          { path: 'abertura', element: <OpeningPage /> },
          { path: 'vender', element: <SellPage />, handle: { nav: true, header: true } satisfies PdvHandle },
          { path: 'sacola', element: <PdvBagPage /> },
          { path: 'pagamento', element: <PdvPaymentPage /> },
          { path: 'pagamento/dividir', element: <SplitPage /> },
          { path: 'concluida/:id', element: <DonePage /> },
          { path: 'vendas', element: <SalesPage />, handle: { nav: true, header: true } satisfies PdvHandle },
          { path: 'vendas/:id', element: <SalePage /> },
          { path: 'caixa', element: <CashPage />, handle: { nav: true, header: true } satisfies PdvHandle },
        ],
      },
      { path: 'entregas/entrar', element: <CourierLoginPage /> },
      {
        path: 'entregas',
        element: <EntregasLayout />,
        children: [
          { index: true, element: <CourierListPage />, handle: { nav: true } satisfies EntregasHandle },
          { path: 'pedido/:id', element: <CourierDetailPage /> },
          { path: 'pedido/:id/coleta', element: <PickupPage /> },
          { path: 'pedido/:id/rota', element: <RoutePage /> },
          { path: 'pedido/:id/entregar', element: <HandoverPage /> },
          { path: 'pedido/:id/problema', element: <ProblemPage /> },
          { path: 'historico', element: <HistoryPage />, handle: { nav: true } satisfies EntregasHandle },
          { path: 'perfil', element: <CourierProfilePage />, handle: { nav: true } satisfies EntregasHandle },
        ],
      },
      {
        element: <LojaLayout />,
        children: [
          { index: true, element: <HomePage />, handle: tabsAndBag },
          { path: 'buscar', element: <SearchPage />, handle: tabs },
          { path: 'categoria/:id', element: <CategoryPage />, handle: tabsAndBag },
          { path: 'produto/:id', element: <ProductPage /> },
          { path: 'linha', element: <BrandPage />, handle: { bagBar: true } satisfies LojaHandle },
          { path: 'sobre', element: <AboutPage /> },
          { path: 'sacola', element: <BagPage /> },
          { path: 'finalizar/identificacao', element: <IdentificationPage /> },
          { path: 'finalizar/entrega', element: <DeliveryPage /> },
          { path: 'finalizar/endereco', element: <AddressPage /> },
          { path: 'finalizar/pagamento', element: <PaymentPage /> },
          { path: 'finalizar/revisao', element: <ReviewPage /> },
          { path: 'pedido-confirmado/:id', element: <ConfirmedPage /> },
          { path: 'pedidos', element: <OrdersPage />, handle: tabs },
          { path: 'pedidos/:id', element: <OrderPage /> },
          { path: 'perfil', element: <ProfilePage />, handle: tabs },
          { path: 'entrar', element: <LoginPage /> },
          { path: '*', element: <NotFound /> },
        ],
      },
    ],
  },
]

export const router = createBrowserRouter(routes)
