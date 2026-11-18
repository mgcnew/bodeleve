import { Pagination, usePagination } from '@/components/Pagination'
import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { Tag } from '@/components/Badges'
import { Box } from '@/components/Card'
import { Button } from '@/components/Button'
import { TextField } from '@/components/Field'
import { Sheet } from '@/components/Sheet'
import { formatPhone } from '@/domain/order'
import { supabase } from '@/lib/supabase'
import { newId } from '@/services/gestao/backoffice'
import { customerErrorMessage, remoteCreateCustomer } from '@/services/gestao/peopleRemote'
import { Banner } from '@/components/Feedback'
import { EmptyState } from '@/components/Feedback'
import { Icon } from '@/components/Icon'
import { normalize } from '@/domain/catalog'
import { formatCents } from '@/domain/money'
import { customersStore } from '@/services/gestao/people'
import o from '@/styles/ops.module.css'
import { Bar } from '../../../shared/OpsBits'
import { SearchBox } from '../compras/Fornecedores'

export function Clientes() {
  const customers = customersStore.useStore()
  const [q, setQ] = useState('')
  const [adding, setAdding] = useState(false)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [days, setDays] = useState('')
  const [errors, setErrors] = useState<{ name?: string; phone?: string; form?: string }>({})
  const [busy, setBusy] = useState(false)
  const digits = q.replace(/\D/g, '')

  const create = async (e: FormEvent) => {
    e.preventDefault()
    const next: typeof errors = {}
    if (!name.trim()) next.name = 'Digite o nome do cliente.'
    if (phone.replace(/\D/g, '').length < 10) next.phone = 'Informe o celular com DDD.'
    const creditDays = days.trim() === '' ? null : Number(days)
    if (creditDays !== null && (!Number.isInteger(creditDays) || creditDays < 1 || creditDays > 365)) next.form = 'O prazo precisa ser de 1 a 365 dias, ou fique em branco para vender sem prazo.'
    setErrors(next)
    if (next.name || next.phone || next.form) return
    if (customers.some((c) => c.phone.replace(/\D/g, '') === phone.replace(/\D/g, ''))) return setErrors({ phone: 'Já existe um cliente com esse celular. Procure na lista pelo número.' })
    setBusy(true)
    try {
      if (supabase) await remoteCreateCustomer({ name, phone, notes: '', creditDays })
      else
        customersStore.set((all) => [
          ...all,
          { id: newId('cli'), name: name.trim(), phone, address: '—', since: new Date().getFullYear().toString(), channel: 'cadastrado na gestão', orderCount: 0, totalCents: 0, fiadoCents: 0, creditDays, lastOrderLabel: 'sem pedidos', topItems: [], history: [], notes: '' },
        ])
      setName('')
      setPhone('')
      setDays('')
      setAdding(false)
    } catch (err) {
      setErrors({ form: customerErrorMessage(err) })
    } finally {
      setBusy(false)
    }
  }
  const visible = customers.filter((c) => normalize(c.name).includes(normalize(q.trim())) || (digits.length > 1 && c.phone.replace(/\D/g, '').includes(digits)))

  const pg = usePagination(visible, q)
  return (
    <div className={o.screen}>
      <Bar
        title="Clientes"
        back="/gestao/mais"
        action={
          <Button
            onClick={() => {
              setErrors({})
              setAdding(true)
            }}
          >
            <Icon name="adicionar" size={20} />
            Cadastrar cliente
          </Button>
        }
      />
      <main className={`${o.main} ${o.mainTop} ${o.narrow}`}>
        <SearchBox label="Nome ou celular" value={q} onChange={setQ} />
        {visible.length === 0 ? (
          <EmptyState icon="buscar" title={`Nada encontrado para “${q}”`} text="Confira a escrita ou busque pelo celular." />
        ) : (
          <Box>
            {pg.items.map((c) => (
              <Link key={c.id} to={`/gestao/clientes/${c.id}`} className={o.row}>
                <span aria-hidden="true" className={o.rowIcon} style={{ borderRadius: 999, background: 'var(--fundo-suave)', fontWeight: 700 }}>
                  {c.name[0]}
                </span>
                <span className={o.rowText}>
                  <span className={o.rowTitle}>{c.name}</span>
                  <span className={o.small}>
                    {c.orderCount} {c.orderCount === 1 ? 'pedido' : 'pedidos'} · {c.lastOrderLabel}
                  </span>
                </span>
                <span className={o.rowEnd}>
                  <b>{formatCents(c.totalCents)}</b>
                  {c.fiadoCents > 0 ? <Tag tone="warning">Deve {formatCents(c.fiadoCents)}</Tag> : c.creditDays ? <Tag tone="info">Prazo {c.creditDays} dias</Tag> : c.orderCount === 1 ? <Tag tone="info">Novo</Tag> : null}
                </span>
                <Icon name="avancar" size={18} />
              </Link>
            ))}
          </Box>
        )}
        <Pagination {...pg} />
        <Button variant="secondary" block className={o.hideDesk} style={{ maxWidth: 480 }} onClick={() => { setErrors({}); setAdding(true) }}>
          Cadastrar cliente
        </Button>
        <Sheet open={adding} onClose={() => setAdding(false)} title="Novo cliente">
          <form onSubmit={(e) => void create(e)} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <TextField label="Nome" autoComplete="off" value={name} error={errors.name} onChange={(e) => { setName(e.target.value); setErrors({}) }} />
            <TextField label="Celular com DDD" type="tel" inputMode="tel" placeholder="(00) 90000-0000" value={phone} error={errors.phone} onChange={(e) => { setPhone(formatPhone(e.target.value)); setErrors({}) }} />
            <TextField label="Prazo para pagar (dias)" inputMode="numeric" placeholder="Em branco = sem prazo" help="Cliente com prazo pode comprar a prazo no balcão. Exemplo: 15 ou 30." value={days} onChange={(e) => { setDays(e.target.value.replace(/\D/g, '')); setErrors({}) }} />
            {errors.form && <Banner tone="error">{errors.form}</Banner>}
            <Button type="submit" size="l" block disabled={busy}>
              Cadastrar cliente
            </Button>
          </form>
        </Sheet>
        <p className={o.muted}>Valor ao lado = total comprado. Quem compra na loja sem conta entra aqui pelo celular informado.</p>
      </main>
    </div>
  )
}
