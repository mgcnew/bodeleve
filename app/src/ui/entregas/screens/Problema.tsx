import { useState } from 'react'
import { Button, ButtonLink } from '@/components/Button'
import { Banner } from '@/components/Feedback'
import { Icon } from '@/components/Icon'
import { RadioGroup, TextAreaField, TextField } from '@/components/Field'
import { returnToStore, undoReturn, type ReturnToken } from '@/services/entregas'
import { courierErrorMessage } from '@/services/entregasRemote'
import { Bar } from '../../shared/OpsBits'
import { useOrder } from './Detalhe'
import { useCourier } from '../useCourier'
import o from '@/styles/ops.module.css'
import e from '../../gestao/screens/estoque/Estoque.module.css'

const reasons = ['Cliente não atende', 'Endereço não encontrado', 'Cliente recusou o pedido', 'Cliente sem o código', 'Outro']

export function Problema() {
  const order = useOrder()
  const { account } = useCourier()
  const [reason, setReason] = useState(reasons[0])
  const [note, setNote] = useState('')
  const [undo, setUndo] = useState<ReturnToken | null>(null)
  const [busy, setBusy] = useState(false)
  const [problem, setProblem] = useState<string>()

  const attempt = async (fn: () => Promise<void>) => {
    setBusy(true)
    setProblem(undefined)
    try {
      await fn()
    } catch (e) {
      setProblem(courierErrorMessage(e))
    } finally {
      setBusy(false)
    }
  }
  if (!order || !account) return null

  if (undo) {
    return (
      <div className={o.screen}>
        <Bar title="Problema na entrega" back="/entregas" />
        <main className={e.done}>
          <div aria-hidden="true" className={e.doneIcon}>
            <Icon name="voltar" size={32} />
          </div>
          <h1 className={o.h1}>Devolução registrada</h1>
          <p className={o.secondary}>Leve o pedido #{order.number} de volta à loja e entregue no balcão. A loja foi avisada e decide se reenvia.</p>
        </main>
        <div className={o.footer}>
          <ButtonLink to="/entregas" size="l" block>
            Voltar às entregas
          </ButtonLink>
          {problem && <Banner tone="error">{problem}</Banner>}
          <Button
            variant="secondary"
            block
            disabled={busy}
            onClick={() =>
              attempt(async () => {
                await undoReturn(order.id, undo)
                setUndo(null)
              })
            }
          >
            Desfazer
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className={o.screen}>
      <Bar title="Problema na entrega" back={`/entregas/pedido/${order.id}/rota`} />
      <main className={`${o.main} ${o.mainTop} ${o.narrow}`}>
        <RadioGroup legend="O que aconteceu?" name="motivo" value={reason} onChange={setReason} options={reasons.map((r) => ({ value: r, title: r }))} />
        <TextAreaField label="Detalhe (opcional)" rows={2} value={note} onChange={(ev) => setNote(ev.target.value)} />
        <TextField label="Foto do local (opcional)" type="file" accept="image/*" capture="environment" disabled help="Disponível quando o armazenamento de fotos estiver ligado." />
        <p className={o.muted}>A loja recebe o aviso na hora e pode ligar para a cliente.</p>
      </main>
      <div className={o.footer}>
        <ButtonLink to={`/entregas/pedido/${order.id}/rota`} variant="secondary" block>
          Tentar de novo
        </ButtonLink>
        {problem && <Banner tone="error">{problem}</Banner>}
        <Button size="l" block disabled={busy} onClick={() => attempt(async () => setUndo(await returnToStore(order.id, account, note ? `${reason} · ${note}` : reason)))}>
          Devolver à loja
        </Button>
      </div>
    </div>
  )
}
