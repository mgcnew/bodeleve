import { Outlet, Link, ScrollRestoration } from 'react-router-dom'
import { AppLinkProvider, ToastProvider, type AppLinkRenderer } from '@/components'

/** Liga o design system ao roteador: links internos navegam sem recarregar a página. */
const renderRouterLink: AppLinkRenderer = ({ href, ...rest }) => {
  if (/^(#|https?:|mailto:|tel:)/.test(href)) {
    // eslint-disable-next-line jsx-a11y/anchor-has-content -- conteúdo vem em `rest.children`
    return <a href={href} {...rest} />
  }
  return <Link to={href} {...rest} />
}

export function AppRoot() {
  return (
    <AppLinkProvider value={renderRouterLink}>
      <ToastProvider bottomOffset={140}>
        <Outlet />
        <ScrollRestoration />
      </ToastProvider>
    </AppLinkProvider>
  )
}
