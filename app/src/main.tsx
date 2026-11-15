import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import '@fontsource/bricolage-grotesque/500.css'
import '@fontsource/bricolage-grotesque/700.css'
import '@fontsource/inter/400.css'
import '@fontsource/inter/500.css'
import '@fontsource/inter/600.css'
import '@fontsource/inter/700.css'
import './styles/base.css'
import { router } from './app/routes'
import { createMockServices } from './mocks/services'
import { ServicesProvider } from './services'

const queryClient = new QueryClient({ defaultOptions: { queries: { retry: 1, staleTime: 30_000 } } })

// D19: sem banco por enquanto. Os serviços são simulados; quando o Supabase for conectado, entra outra implementação aqui.
// Os pedidos de exemplo dos quadros (1042, 1017, 0988) só aparecem em desenvolvimento.
const services = createMockServices({ withSeedOrders: import.meta.env.DEV })

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ServicesProvider services={services}>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </ServicesProvider>
  </StrictMode>,
)
