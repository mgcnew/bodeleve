import { useState } from 'react'
import { Tag } from '@/components/Badges'
import { Box } from '@/components/Card'
import { Button } from '@/components/Button'
import { Banner, EmptyState } from '@/components/Feedback'
import { RadioGroup, TextField } from '@/components/Field'
import { Icon } from '@/components/Icon'
import { Sheet } from '@/components/Sheet'
import type { CourierRecord } from '@/domain/backoffice'
import { formatPhone } from '@/domain/order'
import { supabase } from '@/lib/supabase'
import { newId } from '@/services/gestao/backoffice'
import { courierRegistryStore, couriersStore } from '@/services/gestao/people'
import { courierRegistryErrorMessage, remoteSaveCourier, remoteSetCourierActive } from '@/services/gestao/peopleRemote'
import o from '@/styles/ops.module.css'
import { Bar } from '../../../shared/OpsBits'

const kindLabel = { own: 'Da casa', partner: 'Parceiro' } as const

type Draft = { id?: string; name: string; kind: 'own' | 'partner'; phone: string; vehicle: string; active: boolean }
const empty: Draft = { name: '', kind: 'own', phone: '', vehicle: '', active: true }

// cadastro de entregadores: nome, vínculo, celular e veículo. O celular é o que liga o login ao cadastro (courier_link)
export function Entregadores() {
  const list = courierRegistryStore.useStore()
  const [draft, setDraft] = useState<Draft | null>(null)
  const [nameError, setNameError] = useState<string>()
  const [phoneError, setPhoneError] = useState<string>()
  const [problem, setProblem] = useState<string>()
  const [busy, setBusy] = useState(false)

  const open = (c?: CourierRecord) => {
    setDraft(c ? { ...c } : empty)
    setNameError(undefined)
    setPhoneError(undefined)
    setProblem(undefined)
  }

  const run = async (remote: () => Promise<void>, local: () => void) => {
    setBusy(true)
    setProblem(undefined)
    try {
      if (supabase) await remote()
      else local()
      setDraft(null)
    } catch (e) {
      setProblem(courierRegistryErrorMessage(e))
    } finally {
      setBusy(false)
    }
  }

  const save = () => {
    if (!draft) return
    if (!draft.name.trim()) return setNameError('Digite o nome do entregador.')
    if (draft.phone.replace(/\D/g, '').length < 10) return setPhoneError('Informe o celular com DDD. É com ele que o entregador entra no app.')
    const rec: CourierRecord = { id: draft.id ?? newId('ent'), name: draft.name.trim(), kind: draft.kind, phone: draft.phone, vehicle: draft.vehicle.trim(), active: draft.active }
    void run(
      () => remoteSaveCourier({ name: rec.name, kind: rec.kind, phone: rec.phone, vehicle: rec.vehicle }, draft.id),
      () => {
        courierRegistryStore.set((all) => (draft.id ? all.map((c) => (c.id === rec.id ? rec : c)) : [...all, rec]))
        if (rec.kind === 'own' && !draft.id) couriersStore.set((all) => [{ id: rec.id, name: rec.name, kind: 'own', status: 'available', note: 'na loja' }, ...all])
      },
    )
  }

  const setActive = (active: boolean) => {
    if (!draft?.id) return
    const id = draft.id
    void run(
      () => remoteSetCourierActive(id, active),
      () => {
        courierRegistryStore.set((all) => all.map((c) => (c.id === id ? { ...c, active } : c)))
        if (!active) couriersStore.set((all) => all.filter((c) => c.id !== id))
      },
    )
  }

  return (
    <div className={o.screen}>
      <Bar
        title="Entregadores"
        back="/gestao/entregas"
        action={<Button onClick={() => open()}>Novo entregador</Button>}
      />
      <main className={`${o.main} ${o.mainTop} ${o.narrow}`}>
        {list.length === 0 ? (
          <EmptyState icon="entregas" title="Nenhum entregador cadastrado" text="Cadastre o primeiro com o botão abaixo. Ele entra no app de entregas com o celular informado aqui." />
        ) : (
          <Box>
            {list.map((c) => (
              <button key={c.id} type="button" className={o.row} style={{ minHeight: 64, width: '100%', textAlign: 'left', background: 'transparent', border: 0, cursor: 'pointer' }} onClick={() => open(c)}>
                <span className={o.rowText}>
                  <span className={o.rowTitle}>{c.name}</span>
                  <span className={`${o.small} ${o.num}`}>
                    {[c.phone, c.vehicle].filter(Boolean).join(' · ') || 'Sem celular informado'}
                  </span>
                </span>
                <Tag tone={!c.active ? 'warning' : c.kind === 'own' ? 'success' : 'info'}>{!c.active ? 'Inativo' : kindLabel[c.kind]}</Tag>
                <Icon name="avancar" size={18} />
              </button>
            ))}
          </Box>
        )}
        <p className={o.muted}>O entregador entra no app com o celular cadastrado aqui. Inativo não recebe entregas nem entra no app, e o histórico fica guardado.</p>
      </main>
      <Sheet open={!!draft} onClose={() => setDraft(null)} title={draft?.id ? 'Editar entregador' : 'Novo entregador'}>
        {draft && (
          <>
            <TextField label="Nome" value={draft.name} error={nameError} onChange={(e) => { setDraft({ ...draft, name: e.target.value }); setNameError(undefined) }} />
            <RadioGroup<'own' | 'partner'>
              legend="Vínculo"
              name="vinculo"
              value={draft.kind}
              onChange={(kind) => setDraft({ ...draft, kind })}
              options={[
                { value: 'own', title: 'Entregador da casa', sub: 'Você atribui as entregas' },
                { value: 'partner', title: 'Parceiro', sub: 'Pega entregas publicadas no app' },
              ]}
            />
            <TextField label="Celular com DDD" type="tel" inputMode="tel" placeholder="(00) 90000-0000" value={draft.phone} error={phoneError} onChange={(e) => { setDraft({ ...draft, phone: formatPhone(e.target.value) }); setPhoneError(undefined) }} />
            <TextField label="Veículo" placeholder="Moto · placa" value={draft.vehicle} onChange={(e) => setDraft({ ...draft, vehicle: e.target.value })} />
            {problem && <Banner tone="error">{problem}</Banner>}
            <Button size="l" block disabled={busy} onClick={save}>
              {draft.id ? 'Salvar' : 'Cadastrar entregador'}
            </Button>
            {draft.id && (
              <Button variant={draft.active ? 'danger' : 'secondary'} block disabled={busy} onClick={() => setActive(!draft.active)}>
                {draft.active ? 'Desativar entregador' : 'Reativar entregador'}
              </Button>
            )}
          </>
        )}
      </Sheet>
      <div className={`${o.footer} ${o.hideDesk}`}>
        <Button size="l" block onClick={() => open()}>
          Novo entregador
        </Button>
      </div>
    </div>
  )
}
