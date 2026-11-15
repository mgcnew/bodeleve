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
import { AppRoot } from './AppRoot'
import s from '@/ui/loja/loja.module.css'

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
