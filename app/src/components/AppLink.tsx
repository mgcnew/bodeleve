import { createContext, useContext, type AnchorHTMLAttributes, type ReactElement } from 'react'

export type AppLinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }

/** Função que desenha o link. A raiz do app entrega a do roteador; sem ela, vira um <a> comum. */
export type AppLinkRenderer = (props: AppLinkProps) => ReactElement

// eslint-disable-next-line jsx-a11y/anchor-has-content -- o conteúdo vem de `children` nas props repassadas
const defaultRenderer: AppLinkRenderer = (props) => <a {...props} />

const AppLinkContext = createContext<AppLinkRenderer>(defaultRenderer)

export const AppLinkProvider = AppLinkContext.Provider

/** Link interno que os componentes do design system usam, sem conhecer o roteador. */
export function AppLink(props: AppLinkProps) {
  const render = useContext(AppLinkContext)
  return render(props)
}
