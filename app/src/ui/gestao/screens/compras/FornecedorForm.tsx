import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Button, ButtonLink } from '@/components/Button'
import { Banner, EmptyState } from '@/components/Feedback'
import { TextField } from '@/components/Field'
import { Sheet } from '@/components/Sheet'
import type { Supplier } from '@/domain/backoffice'
import { supabase } from '@/lib/supabase'
import { newId, suppliersStore } from '@/services/gestao/backoffice'
import { remoteArchiveSupplier, remoteSaveSupplier, supplierErrorMessage } from '@/services/gestao/peopleRemote'
import o from '@/styles/ops.module.css'
import { Bar } from '../../../shared/OpsBits'

const placeholder = (v: string) => (/^\[.*\]$/.test(v) ? '' : v)
const days = (leadTime: string) => Number(/(\d+)/.exec(leadTime)?.[1] ?? 0) || null

// cadastro e edição de fornecedor (rotas fornecedores/novo e fornecedores/:id/editar)
export function FornecedorForm() {
  const { id } = useParams()
  const existing = suppliersStore.useStore().find((s) => s.id === id)
  if (id && !existing) {
    return (
      <div className={o.screen}>
        <Bar title="Fornecedor" back="/gestao/fornecedores" />
        <EmptyState bare icon="entregas" title="Fornecedor não encontrado" action={<ButtonLink to="/gestao/fornecedores">Ver fornecedores</ButtonLink>} />
      </div>
    )
  }
  // a chave refaz o formulário quando os dados chegam depois da tela (abrir direto pelo endereço)
  return <FornecedorFormBody key={existing?.id ?? 'novo'} existing={existing} />
}

function FornecedorFormBody({ existing }: { existing?: Supplier }) {
  const id = existing?.id
  const navigate = useNavigate()
  const [name, setName] = useState(existing?.name ?? '')
  const [categories, setCategories] = useState(existing?.categories ?? '')
  const [contactName, setContactName] = useState(existing?.contactName ?? '')
  const [phone, setPhone] = useState(existing?.phone ?? '')
  const [email, setEmail] = useState(placeholder(existing?.email ?? ''))
  const [document, setDocument] = useState(placeholder(existing?.document ?? ''))
  const [leadDays, setLeadDays] = useState(existing ? String(days(existing.leadTime) ?? '') : '')
  const [terms, setTerms] = useState(existing?.paymentTerms ?? '')
  const [nameError, setNameError] = useState<string>()
  const [problem, setProblem] = useState<string>()
  const [busy, setBusy] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const back = id ? `/gestao/fornecedores/${id}` : '/gestao/fornecedores'

  const save = async () => {
    if (!name.trim()) return setNameError('Digite o nome do fornecedor.')
    const lead = Number(leadDays.replace(/\D/g, '')) || null
    setBusy(true)
    setProblem(undefined)
    try {
      if (supabase) {
        await remoteSaveSupplier({ name, categories, contactName, phone, email, document, leadDays: lead, paymentTerms: terms }, id)
      } else {
        const next: Supplier = {
          id: existing?.id ?? newId('forn'),
          name: name.trim(),
          categories: categories.trim(),
          contactName: contactName.trim(),
          phone: phone.trim(),
          email: email.trim() || '[E-MAIL]',
          document: document.trim() || '[CNPJ OU CPF]',
          since: existing?.since ?? String(new Date().getFullYear()),
          paymentTerms: terms.trim(),
          paymentDays: Number(/(\d+)\s*dias?/.exec(terms)?.[1] ?? 0),
          leadTime: lead ? `${lead} dias` : '',
        }
        suppliersStore.set((all) => (existing ? all.map((s) => (s.id === next.id ? next : s)) : [...all, next]))
      }
      navigate(existing ? back : '/gestao/fornecedores', { replace: true })
    } catch (e) {
      setProblem(supplierErrorMessage(e))
      setBusy(false)
    }
  }

  const archive = async () => {
    setBusy(true)
    try {
      if (supabase) await remoteArchiveSupplier(existing!.id)
      else suppliersStore.set((all) => all.filter((s) => s.id !== existing!.id))
      navigate('/gestao/fornecedores', { replace: true })
    } catch (e) {
      setConfirming(false)
      setProblem(supplierErrorMessage(e))
      setBusy(false)
    }
  }

  return (
    <div className={o.screen}>
      <Bar title={existing ? 'Editar fornecedor' : 'Novo fornecedor'} back={back} />
      <main className={`${o.main} ${o.mainTop} ${o.narrow}`}>
        <TextField label="Nome do fornecedor" value={name} error={nameError} onChange={(e) => { setName(e.target.value); setNameError(undefined) }} />
        <TextField label="O que vende" help="Ajuda a achar o fornecedor na busca. Ex.: queijos, doces" value={categories} onChange={(e) => setCategories(e.target.value)} />
        <TextField label="Nome do contato" autoComplete="off" value={contactName} onChange={(e) => setContactName(e.target.value)} />
        <TextField label="Celular ou telefone" type="tel" inputMode="tel" placeholder="(00) 90000-0000" value={phone} onChange={(e) => setPhone(e.target.value)} />
        <TextField label="E-mail" type="email" inputMode="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <TextField label="CNPJ ou CPF" inputMode="numeric" value={document} onChange={(e) => setDocument(e.target.value)} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 10, alignItems: 'start' }}>
          <TextField label="Prazo de entrega (dias)" inputMode="numeric" value={leadDays} onChange={(e) => setLeadDays(e.target.value)} />
          <TextField label="Pagamento padrão" help="Ex.: Boleto, 14 dias" value={terms} onChange={(e) => setTerms(e.target.value)} />
        </div>
        {problem && <Banner tone="error">{problem}</Banner>}
        {existing && (
          <Button variant="quiet" style={{ alignSelf: 'flex-start', padding: 0 }} onClick={() => setConfirming(true)}>
            Arquivar fornecedor
          </Button>
        )}
      </main>
      <Sheet open={confirming} onClose={() => setConfirming(false)} title="Arquivar este fornecedor?" variant="modal">
        <p className={o.muted}>{existing?.name} sai da lista e deixa de receber pedidos novos. Os pedidos e contas antigos continuam guardados.</p>
        <Button variant="danger" block disabled={busy} onClick={() => void archive()}>
          Arquivar
        </Button>
        <Button variant="secondary" block onClick={() => setConfirming(false)}>
          Voltar
        </Button>
      </Sheet>
      <div className={o.footer}>
        <Button size="l" block onClick={() => void save()} disabled={busy}>
          {existing ? 'Salvar alterações' : 'Cadastrar fornecedor'}
        </Button>
      </div>
    </div>
  )
}
