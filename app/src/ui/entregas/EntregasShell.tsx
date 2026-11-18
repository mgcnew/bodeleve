import { useEffect } from 'react'
import { Navigate, Outlet, useLocation, useMatches } from 'react-router-dom'
import { BottomNav } from '@/components/BottomNav'
import { courierSessionStore } from '@/services/entregas'
import { startCourierSync } from '@/services/entregasRemote'
import { resetLoaded, useFirstLoad } from '@/services/firstLoad'
import { ScreenSkeleton } from '@/components/ScreenSkeleton'
import s from './EntregasShell.module.css'

export type EntHandle = { tabs?: boolean }

const tabs = [
  { to: '/entregas', label: 'Entregas', icon: 'entregas', end: true },
  { to: '/entregas/historico', label: 'Histórico', icon: 'historico' },
  { to: '/entregas/perfil', label: 'Perfil', icon: 'perfil' },
] as const

// D — Entregas: exige login por celular cadastrado; a barra some na entrega em andamento (P-D)
export function EntregasShell() {
  const session = courierSessionStore.useStore()
  const location = useLocation()
  const handle = (useMatches().at(-1)?.handle ?? {}) as EntHandle
  const signedIn = !!session
  const ready = useFirstLoad(['courier'])

  // com o Supabase, mantém as entregas livres e as minhas em dia (a cada 10 s)
  useEffect(() => {
    if (!signedIn) return
    const stop = startCourierSync()
    return () => {
      stop()
      resetLoaded()
    }
  }, [signedIn])

  if (!session) return <Navigate to="/entregas/entrar" replace state={{ from: location.pathname }} />

  return (
    <div className={s.page}>
      <div className={s.column}>
        <div className={s.content}>
          {ready ? (
            <div key={location.pathname} className="rota entra">
              <Outlet />
            </div>
          ) : (
            <ScreenSkeleton kind="list" tabs={handle.tabs} />
          )}
        </div>
        {handle.tabs && (
          <div className={s.bottom}>
            <BottomNav items={[...tabs]} />
          </div>
        )}
      </div>
    </div>
  )
}
