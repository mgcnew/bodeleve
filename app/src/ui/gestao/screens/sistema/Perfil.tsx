import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Tag } from '@/components/Badges'
import { Button } from '@/components/Button'
import { Banner } from '@/components/Feedback'
import { Box } from '@/components/Card'
import { TextField, Toggle } from '@/components/Field'
import { supabase } from '@/lib/supabase'
import { roleLabels } from '@/permissions/roles'
import { accountErrorMessage, saveMyName, saveMyPin } from '@/services/account'
import { sessionStore, signOut } from '@/services/gestao/session'
import o from '@/styles/ops.module.css'
import { Bar } from '../../../shared/OpsBits'
import { PasswordForm } from '../../../shared/PasswordForm'
import { singleKeyShortcuts } from '../../components/CommandPalette'

// Meu perfil: nome, senha e (dono e gestor) PIN para cancelar venda; Sair fica aqui e no menu Mais e no PDV
export function Perfil() {
  const session = sessionStore.useStore()
  const navigate = useNavigate()
  const [name, setName] = useState(session?.name ?? '')
  const [nameMsg, setNameMsg] = useState<{ tone: 'success' | 'error'; text: string }>()
  const [pin, setPin] = useState('')
  const [pinMsg, setPinMsg] = useState<{ tone: 'success' | 'error'; text: string }>()
  const [busy, setBusy] = useState(false)
  const [keys, setKeys] = useState(singleKeyShortcuts.enabled())
  if (!session) return null
  const hasPin = session.role === 'owner' || session.role === 'manager'

  const saveName = async (e: FormEvent) => {
    e.preventDefault()
    setBusy(true)
    try {
      await saveMyName(name)
      setNameMsg({ tone: 'success', text: 'Nome salvo.' })
    } catch (err) {
      setNameMsg({ tone: 'error', text: accountErrorMessage(err) })
    } finally {
      setBusy(false)
    }
  }

  const savePin = async (e: FormEvent) => {
    e.preventDefault()
    if (!/^\d{4,8}$/.test(pin)) return setPinMsg({ tone: 'error', text: 'O PIN deve ter de 4 a 8 números.' })
    setBusy(true)
    try {
      await saveMyPin(pin)
      setPin('')
      setPinMsg({ tone: 'success', text: supabase ? 'PIN salvo.' : 'PIN salvo neste aparelho de teste.' })
    } catch (err) {
      setPinMsg({ tone: 'error', text: accountErrorMessage(err) })
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className={o.screen}>
      <Bar title="Meu perfil" back="/gestao/mais" />
      <main className={`${o.main} ${o.mainTop} ${o.narrow}`} style={{ gap: 28 }}>
        <div>
          <div style={{ font: '700 22px/28px var(--fonte-titulo)' }}>{session.name}</div>
          <div className={`${o.muted} ${o.num}`}>{session.email}</div>
          <div style={{ paddingTop: 6 }}>
            <Tag tone="info">{roleLabels[session.role]}</Tag>
          </div>
        </div>

        <form onSubmit={(e) => void saveName(e)} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <h2 className={o.h2}>Seu nome</h2>
          <TextField label="Nome" help="Aparece nos registros de caixa, estoque e pedidos" autoComplete="name" value={name} onChange={(e) => { setName(e.target.value); setNameMsg(undefined) }} />
          {nameMsg && <Banner tone={nameMsg.tone}>{nameMsg.text}</Banner>}
          <Button type="submit" variant="secondary" block disabled={busy || name.trim() === session.name}>
            Salvar nome
          </Button>
        </form>

        <section style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <h2 className={o.h2}>Senha</h2>
          <PasswordForm email={session.email} />
        </section>

        {hasPin && (
          <form onSubmit={(e) => void savePin(e)} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <h2 className={o.h2}>PIN do gestor</h2>
            <TextField label="Novo PIN" type="password" inputMode="numeric" autoComplete="off" help="De 4 a 8 números. Autoriza o cancelamento de vendas no balcão" value={pin} onChange={(e) => { setPin(e.target.value.replace(/\D/g, '').slice(0, 8)); setPinMsg(undefined) }} />
            {pinMsg && <Banner tone={pinMsg.tone}>{pinMsg.text}</Banner>}
            <Button type="submit" variant="secondary" block disabled={busy || pin.length === 0}>
              Salvar PIN
            </Button>
          </form>
        )}

        <section className={o.section}>
          <h2 className={o.caps}>Teclado</h2>
          <Box>
            <Toggle
              label="Atalhos de uma tecla"
              sub="“/” abre a busca e “G” mais uma letra vai ao módulo. Ctrl+K sempre funciona."
              checked={keys}
              onChange={(v) => {
                singleKeyShortcuts.set(v)
                setKeys(v)
              }}
            />
          </Box>
        </section>
        <Button
          variant="secondary"
          block
          onClick={() => {
            signOut()
            navigate('/gestao/entrar')
          }}
        >
          Sair da conta
        </Button>
      </main>
    </div>
  )
}
