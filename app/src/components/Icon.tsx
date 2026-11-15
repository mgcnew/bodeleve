import type { SVGProps } from 'react'
import { iconPaths, type IconName } from './iconPaths'

export type { IconName }

type IconProps = Omit<SVGProps<SVGSVGElement>, 'name' | 'children'> & {
  name: IconName
  /** Lado em px. O conjunto é desenhado em 24; o quadro usa 14, 16, 18, 20, 24, 28 e 30. */
  size?: number
  /** Só passe se o ícone for o único conteúdo do controle; caso contrário o ícone é decorativo. */
  title?: string
}

/** Ícone do conjunto de 24 (DS-Fundamentos). Decorativo por padrão: o nome acessível vem do botão ou do texto ao lado. */
export function Icon({ name, size = 24, title, ...rest }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ flex: 'none' }}
      {...(title ? { role: 'img', 'aria-label': title } : { 'aria-hidden': true })}
      {...rest}
      // Conteúdo estático do nosso próprio conjunto (iconPaths.ts), nunca texto de usuário.
      dangerouslySetInnerHTML={{ __html: iconPaths[name] }}
    />
  )
}
