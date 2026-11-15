import { createContext, useContext, type ReactNode } from 'react'
import type { Services } from './types'

const ServicesContext = createContext<Services | null>(null)

export function ServicesProvider({ services, children }: { services: Services; children: ReactNode }) {
  return <ServicesContext.Provider value={services}>{children}</ServicesContext.Provider>
}

/** As telas pedem os serviços aqui; quem decide se são simulados ou reais é a raiz do app (main.tsx). */
export function useServices(): Services {
  const s = useContext(ServicesContext)
  if (!s) throw new Error('useServices precisa estar dentro de <ServicesProvider>')
  return s
}
