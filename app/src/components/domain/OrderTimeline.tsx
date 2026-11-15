import { cx } from '@/lib/cx'
import { Icon } from '../Icon'
import s from './OrderTimeline.module.css'

export type TimelineStep = {
  label: string
  detail?: string
  state: 'done' | 'current' | 'future'
}

const stateText = { done: 'concluída', current: 'etapa atual', future: 'próxima etapa' } as const

/** Linha do tempo do pedido. Concluída = verde + marca; atual = anel terracota + negrito; futura = anel cinza. */
export function OrderTimeline({ steps, eta }: { steps: TimelineStep[]; eta?: string }) {
  return (
    <div className={s.box}>
      {eta && <div className={s.eta}>{eta}</div>}
      <ol className={s.list}>
        {steps.map((st) => (
          <li key={st.label} className={cx(s.step, s[st.state])} aria-current={st.state === 'current' ? 'step' : undefined}>
            <span className={s.dot} aria-hidden="true">{st.state === 'done' && <Icon name="confirmar" size={14} />}</span>
            <div>
              <div className={s.label}>{st.label}<span className="sr-only"> — {stateText[st.state]}</span></div>
              {st.detail && <div className={s.detail}>{st.detail}</div>}
            </div>
          </li>
        ))}
      </ol>
    </div>
  )
}
