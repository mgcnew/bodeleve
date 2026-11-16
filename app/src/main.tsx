import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import '@/styles/global.css'
import { lojaRoutes } from '@/ui/loja/routes'
import { gestaoRoutes } from '@/ui/gestao/routes'
import { pdvRoutes } from '@/ui/pdv/routes'
import { entregasRoutes } from '@/ui/entregas/routes'

const router = createBrowserRouter([lojaRoutes, ...gestaoRoutes, pdvRoutes, ...entregasRoutes])

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
)
