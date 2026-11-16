import type { ComponentType } from 'react'
import { createBrowserRouter, createMemoryRouter, type RouteObject } from 'react-router-dom'
import { isPreview } from '@/config/preview'
import { ButtonLink, EmptyState } from '@/components'
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
import { AppRoot } from './AppRoot'
import type { GestaoHandle } from '@/ui/gestao/GestaoLayout'
import type { PdvHandle } from '@/ui/pdv/PdvLayout'
import type { EntregasHandle } from '@/ui/entregas/EntregasLayout'
import s from '@/ui/loja/loja.module.css'

/**
 * Gestão, PDV, Entregas e o catálogo do design system carregam sob demanda: quem entra na loja não baixa o código deles.
 * (A loja pública fica no pacote principal.)
 */
const lazyOf =
  <M extends Record<string, unknown>>(load: () => Promise<M>, name: keyof M & string): NonNullable<RouteObject['lazy']> =>
  async () => ({ Component: (await load())[name] as ComponentType })

const g = (module: GestaoHandle['module'], tabs = false): GestaoHandle => ({ module, tabs })
const tabs: LojaHandle = { tabs: true }
const tabsAndBag: LojaHandle = { tabs: true, bagBar: true }

function LoadingScreen() {
  return (
    <main className={s.centerBox}>
      <div role="status" className={s.sub}>Carregando…</div>
    </main>
  )
}

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
    HydrateFallback: LoadingScreen,
    children: [
      { path: 'design-system', lazy: lazyOf(() => import('@/gallery/Gallery'), 'Gallery') },
      ...(isPreview ? [{ path: 'atalhos', lazy: lazyOf(() => import('@/pages/Launcher'), 'Launcher') }] : []),
      { path: 'gestao/entrar', lazy: lazyOf(() => import('@/pages/gestao/LoginPage'), 'AdminLoginPage') },
      {
        path: 'gestao',
        lazy: lazyOf(() => import('@/ui/gestao/GestaoLayout'), 'GestaoLayout'),
        children: [
          { index: true, lazy: lazyOf(() => import('@/pages/gestao/DashboardPage'), 'DashboardPage'), handle: g('dashboard', true) },
          { path: 'pedidos', lazy: lazyOf(() => import('@/pages/gestao/OrdersPage'), 'AdminOrdersPage'), handle: g('orders', true) },
          { path: 'pedidos/:id', lazy: lazyOf(() => import('@/pages/gestao/OrderPage'), 'AdminOrderPage'), handle: g('orders') },
          { path: 'mais', lazy: lazyOf(() => import('@/pages/gestao/MorePage'), 'MorePage'), handle: { tabs: true } satisfies GestaoHandle },
          { path: 'estoque', lazy: lazyOf(() => import('@/pages/gestao/stock'), 'StockPage'), handle: g('stock', true) },
          { path: 'estoque/contagem', lazy: lazyOf(() => import('@/pages/gestao/StockCountPage'), 'StockCountPage'), handle: g('stock') },
          { path: 'estoque/ajuste', lazy: lazyOf(() => import('@/pages/gestao/StockAdjustPage'), 'StockAdjustPage'), handle: g('stock') },
          { path: 'estoque/:id', lazy: lazyOf(() => import('@/pages/gestao/stock'), 'StockItemPage'), handle: g('stock') },
          { path: 'estoque/:id/movimentacoes', lazy: lazyOf(() => import('@/pages/gestao/StockMovementsPage'), 'StockMovementsPage'), handle: g('stock') },
          { path: 'estoque/:id/ajuste', lazy: lazyOf(() => import('@/pages/gestao/StockAdjustPage'), 'StockAdjustPage'), handle: g('stock') },
          { path: 'financeiro', lazy: lazyOf(() => import('@/pages/gestao/finance'), 'FinancePage'), handle: g('finance', true) },
          { path: 'financeiro/contas', lazy: lazyOf(() => import('@/pages/gestao/finance'), 'AccountsPage'), handle: g('finance') },
          { path: 'financeiro/pagar/:id', lazy: lazyOf(() => import('@/pages/gestao/PayPage'), 'PayPage'), handle: g('finance') },
          { path: 'financeiro/lancamentos', lazy: lazyOf(() => import('@/pages/gestao/finance'), 'LedgerPage'), handle: g('finance') },
          { path: 'compras', lazy: lazyOf(() => import('@/pages/gestao/purchasing'), 'PurchasesPage'), handle: g('purchasing') },
          { path: 'compras/novo', lazy: lazyOf(() => import('@/pages/gestao/NewPurchasePage'), 'NewPurchasePage'), handle: g('purchasing') },
          { path: 'compras/:id', lazy: lazyOf(() => import('@/pages/gestao/PurchasePage'), 'PurchasePage'), handle: g('purchasing') },
          { path: 'compras/:id/receber', lazy: lazyOf(() => import('@/pages/gestao/ReceivingPage'), 'ReceivingPage'), handle: g('purchasing') },
          { path: 'fornecedores', lazy: lazyOf(() => import('@/pages/gestao/suppliers'), 'SuppliersPage'), handle: g('purchasing') },
          { path: 'fornecedores/:id', lazy: lazyOf(() => import('@/pages/gestao/suppliers'), 'SupplierPage'), handle: g('purchasing') },
          { path: 'producao', lazy: lazyOf(() => import('@/pages/gestao/production'), 'ProductionPage'), handle: g('production') },
          { path: 'producao/fichas', lazy: lazyOf(() => import('@/pages/gestao/production'), 'RecipesPage'), handle: g('production') },
          { path: 'producao/fichas/:id', lazy: lazyOf(() => import('@/pages/gestao/RecipePage'), 'RecipePage'), handle: g('production') },
          { path: 'producao/ordens/:id', lazy: lazyOf(() => import('@/pages/gestao/ProductionOrderPage'), 'ProductionOrderPage'), handle: g('production') },
          { path: 'produtos', lazy: lazyOf(() => import('@/pages/gestao/products'), 'ProductsPage'), handle: g('stock') },
          { path: 'produtos/categorias', lazy: lazyOf(() => import('@/pages/gestao/products'), 'CategoriesPage'), handle: g('stock') },
          { path: 'produtos/:id', lazy: lazyOf(() => import('@/pages/gestao/products'), 'ProductPage'), handle: g('stock') },
          { path: 'clientes', lazy: lazyOf(() => import('@/pages/gestao/customers'), 'CustomersPage'), handle: g('orders') },
          { path: 'clientes/:id', lazy: lazyOf(() => import('@/pages/gestao/customers'), 'CustomerPage'), handle: g('orders') },
          { path: 'entregas', lazy: lazyOf(() => import('@/pages/gestao/deliveries'), 'DeliveriesPage'), handle: g('deliveries') },
          { path: 'entregas/atribuir/:id', lazy: lazyOf(() => import('@/pages/gestao/deliveries'), 'AssignPage'), handle: g('deliveries') },
          { path: 'relatorios', lazy: lazyOf(() => import('@/pages/gestao/reports'), 'ReportsPage'), handle: g('dashboard') },
          { path: 'relatorios/vendas', lazy: lazyOf(() => import('@/pages/gestao/reports'), 'SalesReportPage'), handle: g('dashboard') },
          { path: 'configuracoes', lazy: lazyOf(() => import('@/pages/gestao/settings'), 'SettingsPage'), handle: g('team') },
          { path: 'configuracoes/casa', lazy: lazyOf(() => import('@/pages/gestao/settings'), 'HousePage'), handle: g('team') },
          { path: 'configuracoes/equipe', lazy: lazyOf(() => import('@/pages/gestao/settings'), 'TeamPage'), handle: g('team') },
          { path: '*', lazy: lazyOf(() => import('@/pages/gestao/ModulePlaceholder'), 'ModulePlaceholder') },
        ],
      },
      {
        path: 'pdv',
        lazy: lazyOf(() => import('@/ui/pdv/PdvLayout'), 'PdvLayout'),
        children: [
          { index: true, lazy: lazyOf(() => import('@/pages/pdv/sell'), 'PdvHome') },
          { path: 'abertura', lazy: lazyOf(() => import('@/pages/pdv/sell'), 'OpeningPage') },
          { path: 'vender', lazy: lazyOf(() => import('@/pages/pdv/sell'), 'SellPage'), handle: { nav: true, header: true } satisfies PdvHandle },
          { path: 'sacola', lazy: lazyOf(() => import('@/pages/pdv/sell'), 'BagPage') },
          { path: 'pagamento', lazy: lazyOf(() => import('@/pages/pdv/checkout'), 'PaymentPage') },
          { path: 'pagamento/dividir', lazy: lazyOf(() => import('@/pages/pdv/checkout'), 'SplitPage') },
          { path: 'concluida/:id', lazy: lazyOf(() => import('@/pages/pdv/checkout'), 'DonePage') },
          { path: 'vendas', lazy: lazyOf(() => import('@/pages/pdv/desk'), 'SalesPage'), handle: { nav: true, header: true } satisfies PdvHandle },
          { path: 'vendas/:id', lazy: lazyOf(() => import('@/pages/pdv/desk'), 'SalePage') },
          { path: 'caixa', lazy: lazyOf(() => import('@/pages/pdv/desk'), 'CashPage'), handle: { nav: true, header: true } satisfies PdvHandle },
        ],
      },
      { path: 'entregas/entrar', lazy: lazyOf(() => import('@/pages/entregas/login'), 'CourierLoginPage') },
      {
        path: 'entregas',
        lazy: lazyOf(() => import('@/ui/entregas/EntregasLayout'), 'EntregasLayout'),
        children: [
          { index: true, lazy: lazyOf(() => import('@/pages/entregas/list'), 'CourierListPage'), handle: { nav: true } satisfies EntregasHandle },
          { path: 'pedido/:id', lazy: lazyOf(() => import('@/pages/entregas/flow'), 'DetailPage') },
          { path: 'pedido/:id/coleta', lazy: lazyOf(() => import('@/pages/entregas/flow'), 'PickupPage') },
          { path: 'pedido/:id/rota', lazy: lazyOf(() => import('@/pages/entregas/flow'), 'RoutePage') },
          { path: 'pedido/:id/entregar', lazy: lazyOf(() => import('@/pages/entregas/flow'), 'HandoverPage') },
          { path: 'pedido/:id/problema', lazy: lazyOf(() => import('@/pages/entregas/flow'), 'ProblemPage') },
          { path: 'historico', lazy: lazyOf(() => import('@/pages/entregas/me'), 'HistoryPage'), handle: { nav: true } satisfies EntregasHandle },
          { path: 'perfil', lazy: lazyOf(() => import('@/pages/entregas/me'), 'ProfilePage'), handle: { nav: true } satisfies EntregasHandle },
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

/**
 * Quem monta a demonstração num lugar sem endereço próprio (VITE_ROUTER=memory) navega só por dentro do app, começando em VITE_START
 * (padrão: a página de atalhos). No resto, é o roteador do navegador.
 */
export const router =
  import.meta.env.VITE_ROUTER === 'memory'
    ? createMemoryRouter(routes, { initialEntries: [import.meta.env.VITE_START ?? '/atalhos'] })
    : createBrowserRouter(routes)
