import type { CSSProperties, ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { IconLink } from '@/components/Button'
import { Icon, type IconName } from '@/components/Icon'
import type { Tone } from '@/components/Badges'
import o from '@/styles/ops.module.css'

/** Barra superior das telas internas (fundo branco, divisória) */
/** `action`: botões da tela; no computador ficam na linha do título, à direita (no celular a tela mostra os seus no corpo ou no rodapé) */
export function Bar({ title, back, end, action }: { title: ReactNode; back: string; end?: ReactNode; action?: ReactNode }) {
  return (
    <header className={o.bar}>
      <IconLink to={back} icon="voltar" label="Voltar" className={back === '/gestao/mais' || back === '/gestao/configuracoes' ? o.backMobile : undefined} />
      <h1 className={o.barTitle}>{title}</h1>
      {end}
      {action && <div className={o.deskAction}>{action}</div>}
    </header>
  )
}

export function PageHeader({ title, sub, end, action }: { title: string; sub?: ReactNode; end?: ReactNode; action?: ReactNode }) {
  return (
    <header className={o.pageHeader}>
      <div>
        <h1 className={o.pageTitle}>{title}</h1>
        {sub && <div className={o.muted}>{sub}</div>}
      </div>
      {end}
      {action && <div className={o.deskAction}>{action}</div>}
    </header>
  )
}

export const toneColors: Record<Tone, { fg: string; bg: string }> = {
  success: { fg: 'var(--sucesso)', bg: 'var(--sucesso-fundo)' },
  warning: { fg: 'var(--atencao)', bg: 'var(--atencao-fundo)' },
  error: { fg: 'var(--erro)', bg: 'var(--erro-fundo)' },
  info: { fg: 'var(--info)', bg: 'var(--info-fundo)' },
}

/** Linha de lista: ícone em quadro colorido, título, apoio e (opcional) valor à direita */
export function ListRow({
  icon,
  tone,
  title,
  sub,
  end,
  to,
}: {
  icon?: IconName
  tone?: Tone
  title: ReactNode
  sub?: ReactNode
  end?: ReactNode
  to?: string
}) {
  const inner = (
    <>
      {icon && (
        <span
          aria-hidden="true"
          className={o.rowIcon}
          style={tone ? { background: toneColors[tone].bg, color: toneColors[tone].fg } : { color: 'var(--texto-secundario)' }}
        >
          <Icon name={icon} size={20} />
        </span>
      )}
      <span className={o.rowText}>
        <span className={o.rowTitle}>{title}</span>
        {sub && <span className={`${o.small} ${o.num}`}>{sub}</span>}
      </span>
      {end && <span className={o.rowEnd}>{end}</span>}
    </>
  )
  return to ? (
    <Link to={to} className={o.row}>
      {inner}
      <Icon name="avancar" size={18} />
    </Link>
  ) : (
    <div className={o.row}>{inner}</div>
  )
}

export function Kpi({ label, value, sub, tone, to }: { label: string; value: ReactNode; sub?: ReactNode; tone?: Tone; to?: string }) {
  const inner = (
    <>
      <span className={o.kpiLabel}>{label}</span>
      <span className={o.kpiValue} style={tone ? { color: toneColors[tone].fg } : undefined}>
        {value}
      </span>
      {sub && <span className={o.kpiSub}>{sub}</span>}
    </>
  )
  const style = tone ? ({ '--kpi-fundo': toneColors[tone].bg } as CSSProperties) : undefined
  return to ? (
    <Link to={to} className={o.kpi} style={style}>
      {inner}
    </Link>
  ) : (
    <div className={o.kpi} style={style}>
      {inner}
    </div>
  )
}

export function SumRow({ label, value }: { label: ReactNode; value: ReactNode }) {
  return (
    <div className={o.sumRow}>
      <span>{label}</span>
      <span>{value}</span>
    </div>
  )
}

export function SumTotal({ label = 'Total', value }: { label?: ReactNode; value: ReactNode }) {
  return (
    <div className={o.sumTotal}>
      <span>{label}</span>
      <span>{value}</span>
    </div>
  )
}

/** Barras de progresso por etapa */
export function StepBars({ total, done, current }: { total: number; done: number; current?: number }) {
  return (
    <div className={o.steps} aria-hidden="true">
      {Array.from({ length: total }, (_, i) => (
        <span
          key={i}
          className={o.stepBar}
          style={{ background: i < done ? 'var(--cor-primaria)' : i === current ? 'var(--cor-primaria)' : undefined }}
        />
      ))}
    </div>
  )
}
