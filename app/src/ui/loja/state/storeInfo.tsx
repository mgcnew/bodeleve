import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { establishment as placeholders } from '@/mocks/establishment'
import { defaultStoreInfo, getStoreInfo, hoursText, type StoreInfo } from '@/services/store'

const StoreInfoContext = createContext<StoreInfo>(defaultStoreInfo)

/** Carrega os dados públicos da casa uma vez; até chegarem, vale o padrão */
export function StoreInfoProvider({ children }: { children: ReactNode }) {
  const [info, setInfo] = useState<StoreInfo>(defaultStoreInfo)
  useEffect(() => {
    let alive = true
    getStoreInfo().then((i) => alive && setInfo(i), () => undefined)
    return () => {
      alive = false
    }
  }, [])
  return <StoreInfoContext.Provider value={info}>{children}</StoreInfoContext.Provider>
}

export const useStoreInfo = () => useContext(StoreInfoContext)

/** Textos da casa com os marcadores [entre colchetes] onde o dono ainda não preencheu */
export function useEstablishment() {
  const info = useStoreInfo()
  return { ...placeholders, name: info.name, address: info.address, whatsapp: info.whatsapp, hours: hoursText(info.hours) }
}
