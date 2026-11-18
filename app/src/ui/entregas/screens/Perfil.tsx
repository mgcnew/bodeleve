import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Tag } from '@/components/Badges'
import { Box } from '@/components/Card'
import { Banner } from '@/components/Feedback'
import { Button } from '@/components/Button'
import { TextField, Toggle } from '@/components/Field'
import { setAvailable, signOutCourier } from '@/services/entregas'
import { courierErrorMessage, remoteSavePix } from '@/services/entregasRemote'
import { supabase } from '@/lib/supabase'
import { PageHeader, SumRow } from '../../shared/OpsBits'
import { PasswordForm } from '../../shared/PasswordForm'
import { useCourier } from '../useCourier'
import o from '@/styles/ops.module.css'

export function Perfil() {
  const { account, session } = useCourier()
  const navigate = useNavigate()
  const [problem, setProblem] = useState<string>()
  const [email, setEmail] = useState<string>()
  useEffect(() => {
    void supabase?.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? undefined))
  }, [])
  if (!account || !session) return null
  const partner = account.kind === 'partner'

  return (
    <div className={o.screen}>
      <PageHeader title="Perfil" />
      <main className={`${o.main} ${o.narrow}`} style={{ gap: 16 }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <span aria-hidden="true" style={{ width: 56, height: 56, borderRadius: 999, background: 'var(--fundo-suave)', border: '1px solid var(--linha)', display: 'flex', alignItems: 'center', justifyContent: 'center', font: '700 22px var(--fonte-titulo)' }}>
            {account.name[0]}
          </span>
          <div>
            <div style={{ font: '700 22px/28px var(--fonte-titulo)' }}>{account.name}</div>
            {partner ? <Tag tone="info">Parceiro</Tag> : <Tag tone="success">Entregador da casa</Tag>}
          </div>
        </div>
        <Box>
          <Toggle label="Disponível para entregas" sub="Desligue quando parar o turno" checked={session.available}
            onChange={async (v) => {
              setProblem(undefined)
              try {
                await setAvailable(v)
              } catch (e) {
                setProblem(courierErrorMessage(e))
              }
            }}
          />
        </Box>
        <div className={o.card}>
          <SumRow label="Veículo" value={account.vehicle} />
          <SumRow label="Celular" value={account.phone} />
          <SumRow label="Pagamento" value={partner ? 'Por entrega, Pix às segundas' : 'Mensal, pela casa'} />
        </div>
        {partner && (
          <TextField
            label="Chave Pix para receber"
            placeholder="[CHAVE PIX]"
            onBlur={(e) => {
              if (supabase) void remoteSavePix(e.target.value).catch((err) => setProblem(courierErrorMessage(err)))
            }}
          />
        )}
        {problem && <Banner tone="error">{problem}</Banner>}
        {email && (
          <section style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <h2 className={o.h2}>Senha</h2>
            <PasswordForm email={email} />
          </section>
        )}
        <p className={o.muted}>Para mudar nome, celular ou veículo, peça à casa.</p>
        <Button
          variant="secondary"
          block
          onClick={() => {
            signOutCourier()
            navigate('/entregas/entrar')
          }}
        >
          Sair da conta
        </Button>
      </main>
    </div>
  )
}
