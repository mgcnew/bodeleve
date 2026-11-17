import { useState } from 'react'
import { Box } from '@/components/Card'
import { Button } from '@/components/Button'
import { Banner } from '@/components/Feedback'
import { FilterChips, SelectField, TextField } from '@/components/Field'
import { Icon } from '@/components/Icon'
import type { TeamMember } from '@/domain/backoffice'
import { moduleAccess, type Module } from '@/permissions/modules'
import { roleLabels, roles, type Role } from '@/permissions/roles'
import { newId } from '@/services/gestao/backoffice'
import { supabase } from '@/lib/supabase'
import { teamStore } from '@/services/gestao/people'
import { remoteCancelInvite, remoteChangeRole, remoteDisableMember, remoteInvite, teamErrorMessage } from '@/services/gestao/peopleRemote'
import { sessionStore } from '@/services/gestao/session'
import { Sheet } from '@/components/Sheet'
import o from '@/styles/ops.module.css'
import { Bar } from '../../../shared/OpsBits'
import s from './Sistema.module.css'

// H-G27 — cinco papéis fixos com acesso por módulo; sem permissão por pessoa nesta versão
// colunas da matriz do design; PDV e app de entregas são ambientes próprios, fora dos módulos da gestão
const areas: { label: string; module: Module | null; own?: Role[] }[] = [
  { label: 'Início e relatórios', module: 'relatorios' },
  { label: 'Pedidos', module: 'pedidos' },
  { label: 'PDV (balcão)', module: null, own: ['owner', 'manager', 'clerk'] },
  { label: 'Estoque', module: 'estoque' },
  { label: 'Compras', module: 'compras' },
  { label: 'Produção', module: 'producao' },
  { label: 'Financeiro', module: 'financeiro' },
  { label: 'Entregas', module: 'entregas', own: ['courier'] },
  { label: 'Equipe e configurações', module: 'configuracoes' },
]

const hasAccess = (role: Role, a: (typeof areas)[number]) => !!a.own?.includes(role) || (a.module !== null && moduleAccess[role].includes(a.module))

const inviteRoles: Role[] = ['clerk', 'manager', 'production', 'courier']

export function Equipe() {
  const team = teamStore.useStore()
  const [role, setRole] = useState<Role>('owner')
  const [open, setOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<Role>('clerk')
  const [error, setError] = useState<string>()
  const [sent, setSent] = useState(false)
  const me = sessionStore.useStore()
  const [editing, setEditing] = useState<TeamMember | null>(null)
  const [newRole, setNewRole] = useState<Role>('clerk')
  const [busy, setBusy] = useState(false)
  const [problem, setProblem] = useState<string>()

  const manage = (m: TeamMember) => {
    setEditing(m)
    setNewRole(m.role)
    setProblem(undefined)
  }

  // o dono e a própria pessoa não se alteram aqui (evita ficar sem acesso)
  const editable = (m: TeamMember) => m.role !== 'owner' && m.detail !== me?.email

  const apply = async (fn: () => Promise<void>, local: (all: TeamMember[]) => TeamMember[]) => {
    setBusy(true)
    setProblem(undefined)
    try {
      if (supabase) await fn()
      else teamStore.set(local)
      setEditing(null)
    } catch (e) {
      setProblem(teamErrorMessage(e))
    } finally {
      setBusy(false)
    }
  }

  const invite = async () => {
    if (!email.includes('@')) return setError('Informe um e-mail válido, por exemplo nome@exemplo.com.')
    try {
      if (supabase) await remoteInvite(email, inviteRole)
      else {
        const m: TeamMember = { id: newId('eq'), name: email.split('@')[0], role: inviteRole, detail: email, pending: true }
        teamStore.set((all) => [...all, m])
      }
    } catch (e) {
      return setError(teamErrorMessage(e))
    }
    setEmail('')
    setError(undefined)
    setOpen(false)
    setSent(true)
  }

  return (
    <div className={o.screen}>
      <Bar title="Equipe e permissões" back="/gestao/configuracoes" />
      <main className={`${o.main} ${o.mainTop} ${o.narrow}`}>
        <Box>
          {team.map((m) => (
            <div key={m.id} className={o.row} style={{ minHeight: 56 }}>
              <span aria-hidden="true" className={o.rowIcon} style={{ borderRadius: 999, background: 'var(--cor-creme)', width: 36, height: 36, fontWeight: 700 }}>
                {m.name[0] === '[' ? 'D' : m.name[0].toUpperCase()}
              </span>
              <span className={o.rowText}>
                <span className={o.rowTitle}>{m.name}</span>
                <span className={o.small}>{m.pending ? `Convite pendente · ${m.detail}` : m.detail}</span>
              </span>
              <span style={{ padding: '4px 10px', borderRadius: 8, background: 'var(--cor-creme)', border: '1px solid var(--linha)', font: '600 13px/18px var(--fonte-texto)' }}>{roleLabels[m.role]}</span>
              {editable(m) && (
                <Button variant="quiet" aria-label={`Alterar ${m.name}`} onClick={() => manage(m)}>
                  Alterar
                </Button>
              )}
            </div>
          ))}
        </Box>
        {!open ? (
          <Button variant="secondary" block style={{ maxWidth: 420 }} onClick={() => setOpen(true)}>
            Convidar pessoa
          </Button>
        ) : (
          <div style={{ padding: 16, borderRadius: 12, background: 'var(--cor-terracota-suave)', display: 'flex', flexDirection: 'column', gap: 12 }}>
            <TextField label="E-mail" type="email" placeholder="nome@exemplo.com" value={email} error={error} onChange={(e) => setEmail(e.target.value)} />
            <SelectField label="Papel" value={inviteRole} onChange={(e) => setInviteRole(e.target.value as Role)} options={inviteRoles.map((r) => ({ value: r, label: roleLabels[r] }))} />
            <Button onClick={() => void invite()}>Registrar convite</Button>
          </div>
        )}
        <Sheet open={!!editing} onClose={() => setEditing(null)} title={editing ? editing.name : ''}>
          {editing && (
            <>
              {!editing.pending && <SelectField label="Papel" value={newRole} onChange={(e) => setNewRole(e.target.value as Role)} options={inviteRoles.map((r) => ({ value: r, label: roleLabels[r] }))} />}
              {problem && <Banner tone="error">{problem}</Banner>}
              {!editing.pending && (
                <Button
                  size="l"
                  block
                  disabled={busy || newRole === editing.role}
                  onClick={() => void apply(() => remoteChangeRole(editing.id, newRole), (all) => all.map((x) => (x.id === editing.id ? { ...x, role: newRole } : x)))}
                >
                  Salvar papel
                </Button>
              )}
              <Button
                variant="danger"
                block
                disabled={busy}
                onClick={() => void apply(() => (editing.pending ? remoteCancelInvite(editing.id) : remoteDisableMember(editing.id)), (all) => all.filter((x) => x.id !== editing.id))}
              >
                {editing.pending ? 'Cancelar convite' : 'Tirar o acesso'}
              </Button>
              <Button variant="secondary" block onClick={() => setEditing(null)}>
                Voltar
              </Button>
            </>
          )}
        </Sheet>
        {sent && <Banner tone="info">Convite registrado. O e-mail só sai quando o login estiver ligado ao Supabase.</Banner>}
        <section className={o.section}>
          <h2 className={o.h2}>O que cada papel vê</h2>
          <FilterChips label="Papel" value={role} onChange={setRole} options={roles.map((r) => ({ value: r, label: roleLabels[r] }))} />
          <Box>
            {areas.map((a) => (
              <div key={a.label} className={s.permRow}>
                <span>{a.label}</span>
                {hasAccess(role, a) ? (
                  <span className={s.yes}>
                    <Icon name="confirmar" size={18} />
                    Vê e usa
                  </span>
                ) : (
                  <span className={s.no}>Sem acesso</span>
                )}
              </div>
            ))}
          </Box>
        </section>
        <p className={o.muted}>Papéis fixos nesta versão. Permissão por pessoa fica para depois, se precisar.</p>
      </main>
    </div>
  )
}
