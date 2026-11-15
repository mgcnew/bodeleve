import { render } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { routes } from '@/app/routes'
import { createMockServices, type MockOptions } from '@/mocks/services'
import { ServicesProvider } from '@/services'
import type { Services } from '@/services/types'
import { emptyAddress, useBag, useCheckout, useSession } from '@/store/bag'

/** Storage em memória para os testes: nada vaza entre um teste e outro. */
export function memoryStorage() {
  const data = new Map<string, string>()
  return { getItem: (k: string) => data.get(k) ?? null, setItem: (k: string, v: string) => void data.set(k, v) }
}

export function resetStores() {
  localStorage.clear()
  useBag.setState({ items: {}, fulfillment: 'delivery' })
  useCheckout.setState({
    contact: { name: '', phone: '' },
    address: emptyAddress,
    deliveryWindowId: 'asap',
    pickupWindowId: 'asap',
    paymentMethod: 'pix',
    changeFor: '',
  })
  useSession.setState({ phone: null })
}

export function renderApp(path = '/', opts: MockOptions & { services?: (base: Services) => Services } = {}) {
  const { services: override, ...mock } = opts
  const base = createMockServices({ storage: memoryStorage(), code: () => '4821', ...mock })
  const services = override ? override(base) : base
  const router = createMemoryRouter(routes, { initialEntries: [path] })
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, staleTime: 0 } } })
  const utils = render(
    <ServicesProvider services={services}>
      <QueryClientProvider client={client}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </ServicesProvider>,
  )
  return { router, ...utils }
}
