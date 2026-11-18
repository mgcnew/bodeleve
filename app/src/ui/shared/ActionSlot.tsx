import { createContext, useContext } from 'react'

/** Onde as ações da tela aparecem no computador: o contêiner de ações da barra superior da gestão */
export const ActionSlotContext = createContext<HTMLElement | null>(null)
export const useActionSlot = () => useContext(ActionSlotContext)
