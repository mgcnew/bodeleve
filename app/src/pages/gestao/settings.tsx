import { useId, useState, type FormEvent } from 'react'
import { AppLink, Banner, Button, Chip, Icon, IndicatorSkeleton, ListSkeleton, StatusTag, TextField } from '@/components'
import { emptyHouse, invitableRoles, roleLabel, roleMatrix, roleOrder, validateHouse, type House, type HouseErrors } from '@/domain/settings'
import { formatBRL } from '@/lib/format'
import type { Role } from '@/permissions'
import { useServices } from '@/services'
import { useAdminSession } from '@/store/admin'
import { useHouse, useInvalidateCatalog, useSettingsOverview, useTeam } from '@/ui/gestao/queries'
import { Footer, QueryBoundary, ScreenHeader } from '@/ui/loja/parts'
import s from '@/ui/gestao/gestao.module.css'
import l from '@/ui/loja/loja.module.css'

const h2 = { font: '700 17px/24px var(--fonte-titulo)', margin: 0 } as const
const selectStyle = { height: 48, padding: '0 12px', borderRadius: 8, border: '1.5px solid var(--linha)', background: 'var(--superficie)', font: 'var(--corpo)', color: 'var(--texto)', width: '100%' } as const

function Info({ title, detail }: { title: string; detail: string }) {
  return (
    <div className={s.plainRow} style={{ minHeight: 64 }}>
      <span className={l.grow}>
        <span className={l.optionTitle}>{title}</span>
        <span className={l.optionDetail}>{detail}</span>
      </span>
    </div>
  )
}

export function SettingsPage() {
  const query = useSettingsOverview()
  return (
    <>
      <ScreenHeader title="Configurações" back="/gestao/mais" />
      <main className={s.main} style={{ gap: 16, paddingTop: 16 }}>
        <QueryBoundary query={query} skeleton={<ListSkeleton rows={5} label="Carregando configurações" />} errorTitle="Não foi possível carregar as configurações">
          {(o) => (
            <div className={l.linkList}>
              <AppLink href="/gestao/configuracoes/casa" className={l.linkRow} style={{ minHeight: 72 }}>
                <span className={l.grow}>
                  <span className={l.optionTitle}>A casa</span>
                  <span className={l.optionDetail}>Nome, endereço, horários, WhatsApp, logotipo</span>
                </span>
                <Icon name="avancar" size={18} />
              </AppLink>
              <AppLink href="/gestao/configuracoes/equipe" className={l.linkRow} style={{ minHeight: 72 }}>
                <span className={l.grow}>
                  <span className={l.optionTitle}>Equipe e permissões</span>
                  <span className={l.optionDetail}>{o.people} {o.people === 1 ? 'pessoa' : 'pessoas'} · {o.roles} {o.roles === 1 ? 'papel' : 'papéis'}</span>
                </span>
                <Icon name="avancar" size={18} />
              </AppLink>
              <Info title="Loja online" detail={`Entrega: taxa fixa ${formatBRL(o.deliveryFeeCents)} · retirada grátis`} />
              <Info title="Formas de pagamento" detail={o.paymentLabels.map((p, i) => (i === 0 ? p : p.charAt(0).toLowerCase() + p.slice(1))).join(', ')} />
              <Info title="Nota fiscal" detail="Não configurado · aguardando decisão" />
            </div>
          )}
        </QueryBoundary>
        <div className={l.sub}>Loja online, pagamentos e nota fiscal dependem de respostas pendentes (Q6 a Q8 e Q12).</div>
      </main>
    </>
  )
}

function HouseForm({ initial }: { initial: House }) {
  const { admin } = useServices()
  const invalidate = useInvalidateCatalog()
  const [house, setHouse] = useState<House>(initial)
  const [errors, setErrors] = useState<HouseErrors>({})
  const [saved, setSaved] = useState(false)
  const [failed, setFailed] = useState(false)
  const [busy, setBusy] = useState(false)
  const set = (patch: Partial<House>) => { setHouse((h) => ({ ...h, ...patch })); setSaved(false) }
  const setHours = (patch: Partial<House['hours']>) => { setHouse((h) => ({ ...h, hours: { ...h.hours, ...patch } })); setSaved(false) }

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    const errs = validateHouse(house)
    setErrors(errs)
    setSaved(false)
    setFailed(false)
    if (Object.keys(errs).length) return
    setBusy(true)
    try {
      const clean = await admin.settings.saveHouse(house)
      setHouse(clean)
      await invalidate()
      setSaved(true)
    } catch {
      setFailed(true)
    }
    setBusy(false)
  }

  return (
    <form onSubmit={submit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div className={l.stack} style={{ gap: 8 }}>
        <div className={l.sub} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 96, borderRadius: 12, border: '1.5px dashed var(--linha)' }}>[LOGO]</div>
        <div className={l.sub}>Logotipo oficial ainda não aprovado. Até lá, a marca aparece só como texto.</div>
      </div>
      <TextField label="Nome" value={house.name} onChange={(e) => set({ name: e.target.value })} error={errors.name} />
      <TextField label="CNPJ" placeholder="[CNPJ]" inputMode="numeric" value={house.cnpj} onChange={(e) => set({ cnpj: e.target.value })} error={errors.cnpj} />
      <TextField label="Endereço" placeholder="[ENDEREÇO DA LOJA]" value={house.address} onChange={(e) => set({ address: e.target.value })} />
      <TextField label="WhatsApp de atendimento" type="tel" placeholder="[WHATSAPP DA LOJA]" value={house.whatsapp} onChange={(e) => set({ whatsapp: e.target.value })} error={errors.whatsapp} />
      <fieldset className={l.fieldset}>
        <legend style={h2}>Horário de funcionamento</legend>
        <TextField label="Segunda a sexta" placeholder="[HORÁRIO]" value={house.hours.weekdays} onChange={(e) => setHours({ weekdays: e.target.value })} />
        <TextField label="Sábado" placeholder="[HORÁRIO]" value={house.hours.saturday} onChange={(e) => setHours({ saturday: e.target.value })} />
        <TextField label="Domingo" placeholder="[HORÁRIO]" value={house.hours.sunday} onChange={(e) => setHours({ sunday: e.target.value })} />
      </fieldset>
      <div role="status" aria-live="polite">
        {saved && <Banner tone="success">Dados da casa salvos.</Banner>}
        {failed && <Banner tone="error">Não foi possível salvar. Nada foi alterado. Tente de novo.</Banner>}
      </div>
      <Footer>
        <Button type="submit" size="lg" fullWidth loading={busy}>Salvar</Button>
      </Footer>
    </form>
  )
}

export function HousePage() {
  const query = useHouse()
  return (
    <>
      <ScreenHeader title="A casa" back="/gestao/configuracoes" />
      <main className={s.main} style={{ gap: 16, paddingTop: 16 }}>
        <QueryBoundary query={query} skeleton={<IndicatorSkeleton label="Carregando dados da casa" />} errorTitle="Não foi possível carregar os dados da casa">
          {(h) => <HouseForm initial={{ ...emptyHouse, ...h }} />}
        </QueryBoundary>
      </main>
    </>
  )
}

function Invite({ onDone }: { onDone: (email: string) => void }) {
  const { admin } = useServices()
  const invalidate = useInvalidateCatalog()
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<Role>('clerk')
  const [error, setError] = useState<string | undefined>()
  const [busy, setBusy] = useState(false)
  const roleId = useId()
  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setError(undefined)
    setBusy(true)
    try {
      await admin.settings.invite(email, role)
      await invalidate()
      onDone(email.trim())
    } catch (err) {
      const code = (err as Error).message
      setError(code === 'duplicate' ? 'Essa pessoa já está na equipe.' : 'Informe um e-mail válido, por exemplo nome@exemplo.com.')
    }
    setBusy(false)
  }
  return (
    <form onSubmit={submit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <TextField label="E-mail" type="email" placeholder="nome@exemplo.com" value={email} onChange={(e) => setEmail(e.target.value)} error={error} />
      <div className={l.stack} style={{ gap: 6 }}>
        <label htmlFor={roleId} style={{ fontWeight: 600 }}>Papel</label>
        <select id={roleId} value={role} onChange={(e) => setRole(e.target.value as Role)} style={selectStyle}>
          {invitableRoles.map((r) => <option key={r} value={r}>{roleLabel[r]}</option>)}
        </select>
      </div>
      <Button type="submit" loading={busy}>Enviar convite</Button>
    </form>
  )
}

export function TeamPage() {
  const query = useTeam()
  const me = useAdminSession((x) => x.user)
  const [opening, setOpening] = useState(false)
  const [invited, setInvited] = useState<string | null>(null)
  const [role, setRole] = useState<Role>('owner')
  return (
    <>
      <ScreenHeader title="Equipe e permissões" back="/gestao/configuracoes" />
      <main className={s.main} style={{ gap: 16, paddingTop: 16 }}>
        <QueryBoundary query={query} skeleton={<ListSkeleton rows={5} label="Carregando equipe" />} errorTitle="Não foi possível carregar a equipe">
          {(team) => (
            <div className={l.linkList}>
              {team.map((m) => (
                <div key={m.id} className={s.plainRow} style={{ minHeight: 64 }}>
                  <span className={s.disc} style={{ fontWeight: 700 }} aria-hidden="true">{m.name.charAt(0).toUpperCase()}</span>
                  <span className={l.grow}>
                    <span className={l.optionTitle}>{m.name}</span>
                    <span className={l.optionDetail}>{m.id === me?.id ? 'Você' : m.note}</span>
                  </span>
                  <StatusTag tone={m.pending ? 'warning' : 'neutral'}>{roleLabel[m.role]}</StatusTag>
                </div>
              ))}
            </div>
          )}
        </QueryBoundary>
        {!opening && !invited && <Button variant="secondary" onClick={() => setOpening(true)}>Convidar pessoa</Button>}
        {opening && !invited && <Invite onDone={(e) => { setInvited(e); setOpening(false) }} />}
        {invited && (
          <div role="status">
            <Banner tone="success">Convite registrado para {invited}. O envio do e-mail ainda não está ligado nesta versão.</Banner>
          </div>
        )}
        {invited && <Button variant="ghost" onClick={() => setInvited(null)}>Convidar outra pessoa</Button>}
        <section aria-labelledby="matriz" className={l.stack} style={{ gap: 12 }}>
          <h2 id="matriz" style={h2}>O que cada papel vê</h2>
          <div role="group" aria-label="Papel" className={s.filters}>
            {roleOrder.map((r) => <Chip key={r} selected={role === r} onClick={() => setRole(r)}>{roleLabel[r]}</Chip>)}
          </div>
          <div className={l.linkList}>
            {roleMatrix(role).map((row) => (
              <div key={row.module} className={s.plainRow} style={{ justifyContent: 'space-between', minHeight: 48 }}>
                <span>{row.label}</span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: row.allowed ? 'var(--sucesso)' : 'var(--texto-secundario)', fontWeight: 600 }}>
                  {row.allowed && <Icon name="confirmar" size={18} />}
                  {row.allowed ? 'Vê e usa' : 'Sem acesso'}
                </span>
              </div>
            ))}
          </div>
        </section>
        <div className={l.sub}>Papéis fixos nesta versão. Permissão por pessoa fica para depois, se precisar.</div>
      </main>
    </>
  )
}
