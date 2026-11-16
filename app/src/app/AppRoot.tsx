import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Outlet, Link, ScrollRestoration } from 'react-router-dom'
import { AppLinkProvider, ToastProvider, type AppLinkRenderer } from '@/components'
import { useServices } from '@/services'

/** Liga o design system ao roteador: links internos navegam sem recarregar a página. */
const renderRouterLink: AppLinkRenderer = ({ href, ...rest }) => {
  if (/^(#|https?:|mailto:|tel:)/.test(href)) {
    // eslint-disable-next-line jsx-a11y/anchor-has-content -- conteúdo vem em `rest.children`
    return <a href={href} {...rest} />
  }
  return <Link to={href} {...rest} />
}

/** Pedidos novos, mudança de status, entregas e caixa chegam de outra aba ou aparelho: as telas abertas se atualizam sozinhas. */
function useLiveRefresh() {
  const { realtime } = useServices()
  const client = useQueryClient()
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined
    const off = realtime.onChange(() => {
      clearTimeout(timer)
      timer = setTimeout(() => void client.invalidateQueries(), 100)
    })
    return () => {
      clearTimeout(timer)
      off()
    }
  }, [realtime, client])
}

export function AppRoot() {
  useLiveRefresh()
  return (
    <AppLinkProvider value={renderRouterLink}>
      <ToastProvider bottomOffset={140}>
        <Outlet />
        <ScrollRestoration />
      </ToastProvider>
    </AppLinkProvider>
  )
}
