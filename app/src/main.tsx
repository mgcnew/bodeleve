import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import '@/styles/global.css'
import { lojaRoutes } from '@/ui/loja/routes'
import { restoreSession } from '@/services/gestao/session'

void restoreSession()

// só a loja vem junto com a página; gestão, PDV e entregas carregam na primeira visita à área
const router = createBrowserRouter([lojaRoutes], {
  async patchRoutesOnNavigation({ path, patch }) {
    if (path.startsWith('/gestao')) patch(null, (await import('@/ui/gestao/routes')).gestaoRoutes)
    else if (path.startsWith('/pdv')) patch(null, [(await import('@/ui/pdv/routes')).pdvRoutes])
    else if (path.startsWith('/entregas')) patch(null, (await import('@/ui/entregas/routes')).entregasRoutes)
  },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
)
