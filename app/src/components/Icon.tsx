// Conjunto de 24 ícones de traço (P-K). Fonte: gen/common.py — mantenha os dois iguais.
import type { SVGProps } from 'react'

const paths = {
  'inicio': <><path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" /></>,
  'buscar': <><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></>,
  'sacola': <><path d="M6 8h12l1 12H5L6 8z" /><path d="M9 8V6a3 3 0 0 1 6 0v2" /></>,
  'perfil': <><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></>,
  'pedidos': <><path d="M6 3h12v18l-3-2-3 2-3-2-3 2V3z" /><path d="M9 8h6" /><path d="M9 12h6" /></>,
  'estoque': <><path d="M3 8l9-5 9 5v8l-9 5-9-5V8z" /><path d="M3 8l9 5 9-5" /><path d="M12 13v8" /></>,
  'financeiro': <><path d="M3 7h16a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z" /><path d="M3 7V6a2 2 0 0 1 2-2h11" /><path d="M16 13.5h2" /></>,
  'mais': <><path d="M4 4h6v6H4z" /><path d="M14 4h6v6h-6z" /><path d="M4 14h6v6H4z" /><path d="M14 14h6v6h-6z" /></>,
  'vender': <><path d="M3 12V4h8l10 10-8 8L3 12z" /><circle cx="7.5" cy="7.5" r="1.2" /></>,
  'historico': <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
  'caixa': <><path d="M3 6h18v12H3z" /><circle cx="12" cy="12" r="3" /></>,
  'entregas': <><path d="M3 7h11v9H3z" /><path d="M14 10h4l3 3v3h-7" /><circle cx="7" cy="17" r="2" /><circle cx="17" cy="17" r="2" /></>,
  'compras': <><path d="M3 4h2l2.5 11h10L20 7H6.5" /><circle cx="9" cy="19" r="1.5" /><circle cx="17" cy="19" r="1.5" /></>,
  'producao': <><path d="M3 21V10l6 4v-4l6 4V5h6v16H3z" /></>,
  'adicionar': <><path d="M12 5v14" /><path d="M5 12h14" /></>,
  'remover': <><path d="M5 12h14" /></>,
  'avancar': <><path d="M9 5l7 7-7 7" /></>,
  'voltar': <><path d="M15 5l-7 7 7 7" /></>,
  'confirmar': <><path d="M5 12.5l4.5 4.5L19 7.5" /></>,
  'fechar': <><path d="M6 6l12 12" /><path d="M18 6L6 18" /></>,
  'alerta': <><path d="M12 4l9 16H3L12 4z" /><path d="M12 10v4" /><path d="M12 17v.5" /></>,
  'validade': <><path d="M4 6h16v14H4z" /><path d="M4 10h16" /><path d="M8 3v4" /><path d="M16 3v4" /></>,
  'local': <><path d="M12 21s7-6.2 7-11a7 7 0 0 0-14 0c0 4.8 7 11 7 11z" /><circle cx="12" cy="10" r="2.5" /></>,
  'sem-conexao': <><path d="M3 9a14 14 0 0 1 18 0" /><path d="M6.5 12.5a9 9 0 0 1 11 0" /><path d="M10 16a4 4 0 0 1 4 0" /><path d="M4 4l16 16" /></>,
} as const

export type IconName = keyof typeof paths

type Props = Omit<SVGProps<SVGSVGElement>, 'name'> & { name: IconName; size?: number }

export function Icon({ name, size = 24, ...rest }: Props) {
  return (
    <svg
      aria-hidden="true"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ flex: 'none' }}
      {...rest}
    >
      {paths[name]}
    </svg>
  )
}
