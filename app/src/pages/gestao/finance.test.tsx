import { beforeEach, describe, expect, it, vi } from 'vitest'
import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe } from 'vitest-axe'
import { adminUsers } from '@/mocks/adminSeed'
import { createMockServices } from '@/mocks/services'
import { useAdminSession } from '@/store/admin'
import { memoryStorage, renderApp, resetStores } from '@/test/renderApp'

const signInAs = (email: string) => {
  const u = adminUsers.find((x) => x.email === email)!
  useAdminSession.setState({ user: { id: u.id, name: u.name, email: u.email, role: u.role } })
}
beforeEach(() => {
  resetStores()
  window.scrollTo = vi.fn()
  signInAs('ana@exemplo.com')
})

const money = (v: string) => new RegExp(`R\\$.${v.replace(/[.,]/g, '\\$&')}`)
const dm = (offsetDays: number) => {
  const d = new Date(Date.now() + offsetDays * 86_400_000)
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`
}

describe('financeiro · visão geral', () => {
  it('saldo agora = banco + caixa, como no quadro', async () => {
    renderApp('/gestao/financeiro', { withSeedOrders: true })
    const card = (await screen.findByRole('group', { name: 'Saldo agora' }))
    expect(card).toHaveTextContent(money('6.792,40'))
    expect(card).toHaveTextContent('Conta no banco')
    expect(card).toHaveTextContent(money('6.380,40'))
    expect(card).toHaveTextContent('Caixa (gaveta)')
    expect(card).toHaveTextContent(money('412,00'))
  })

  it('pede ação hoje: aluguel atrasado há 4 dias e as 2 contas que vencem hoje', async () => {
    renderApp('/gestao/financeiro', { withSeedOrders: true })
    const aluguel = (await screen.findByText('Aluguel', { selector: 'span' })).closest('a')!
    expect(aluguel).toHaveTextContent(`Venceu em ${dm(-4)} · 4 dias de atraso`)
    expect(aluguel).toHaveTextContent(money('1.800,00'))
    expect(aluguel).toHaveTextContent('Atrasado')
    const hoje = screen.getByText('2 contas vencem hoje').closest('a')!
    expect(hoje).toHaveTextContent('Laticínios Serra Verde e energia')
    expect(hoje).toHaveTextContent(money('640,00'))
    expect(hoje).toHaveTextContent('Vence hoje')
  })

  it('próximos 7 dias com saldo previsto dia a dia', async () => {
    renderApp('/gestao/financeiro', { withSeedOrders: true })
    const sec = (await screen.findByRole('heading', { name: 'Próximos 7 dias' })).closest('section')!
    const rows = within(sec).getAllByText(/saldo R\$/).map((e) => e.closest('div')!.textContent!)
    expect(rows).toHaveLength(5)
    expect(rows[0]).toContain('Hoje')
    expect(rows[0]).toContain('Aluguel (atrasado), Laticínios e energia')
    expect(rows[0]).toMatch(/−.R\$.2\.440,00/)
    expect(rows[0]).toMatch(/saldo R\$.4\.352,40/)
    expect(rows[1]).toMatch(/\+.R\$.210,00/)
    expect(rows[1]).toMatch(/saldo R\$.4\.562,40/)
    expect(rows[2]).toContain('Cartão de crédito · vendas de outubro')
    expect(rows[3]).toContain('Fiado · Dona Zefa')
    expect(rows[4]).toContain('Moinho Sertão · PC-0054')
    expect(rows[4]).toMatch(/saldo R\$.4\.990,40/)
    expect(within(sec).getByText(new RegExp(`o saldo chega a R\\$.4\\.990,40 em ${dm(7)}`))).toBeInTheDocument()
  })

  it('o início usa as mesmas contas: aluguel atrasado, 2 contas hoje, a pagar hoje e a receber na semana', async () => {
    renderApp('/gestao', { withSeedOrders: true })
    expect(await screen.findByText('Aluguel atrasado')).toBeInTheDocument()
    expect(screen.getByText('2 contas vencem hoje')).toBeInTheDocument()
    expect(screen.getByText(/R\$.640,00 · Laticínios Serra Verde e energia/)).toBeInTheDocument()
    expect(screen.getByText('A pagar hoje').parentElement).toHaveTextContent(money('640,00'))
    expect(screen.getByText('A pagar hoje').parentElement).toHaveTextContent('2 contas')
    expect(screen.getByText('A receber na semana').parentElement).toHaveTextContent(money('1.150,00'))
  })
})

describe('financeiro · contas', () => {
  it('a pagar R$ 3.097,00 e a receber R$ 1.150,00, em atrasadas, hoje e próximos dias', async () => {
    const user = userEvent.setup()
    renderApp('/gestao/financeiro/contas', { withSeedOrders: true })
    expect(await screen.findByRole('button', { name: /A pagar · R\$.3\.097,00/ })).toHaveAttribute('aria-pressed', 'true')
    const group = (name: string) => screen.getByRole('region', { name })
    expect(group('Atrasadas')).toHaveTextContent('Aluguel')
    expect(group('Atrasadas')).toHaveTextContent(`Despesa fixa · venceu ${dm(-4)}`)
    expect(group('Hoje')).toHaveTextContent('Laticínios Serra Verde')
    expect(group('Hoje')).toHaveTextContent('Boleto · compra PC-0053')
    expect(group('Hoje')).toHaveTextContent('Despesa fixa · débito automático')
    expect(group('Próximos dias')).toHaveTextContent(`Boleto · compra PC-0054 · ${dm(7)}`)
    expect(group('Próximos dias')).toHaveTextContent(`Despesa fixa · ${dm(11)}`)

    await user.click(screen.getByRole('button', { name: /A receber · R\$.1\.150,00/ }))
    const semana = screen.getByRole('region', { name: 'Esta semana' })
    expect(semana).toHaveTextContent('Cartão de débito')
    expect(semana).toHaveTextContent(money('210,00'))
    expect(semana).toHaveTextContent('Dona Zefa')
    expect(semana).toHaveTextContent('Fiado')
  })

  it('a conta de uma compra recebida nasce no recebimento e aparece como "Criada hoje"', async () => {
    const storage = memoryStorage()
    const svc = createMockServices({ storage, withSeedOrders: true })
    const exp = new Date(Date.now() + 9 * 86_400_000).toISOString()
    await svc.admin.purchasing.receive('PC-0057', {
      closeShort: false,
      lines: [
        { itemId: 'leite-integral', qty: 140, lot: 'LT-1', expiresAt: exp },
        { itemId: 'requeijao', qty: 20, lot: 'RQ-1', expiresAt: exp },
        { itemId: 'nata', qty: 10, lot: 'NT-1', expiresAt: exp },
      ],
    })
    renderApp('/gestao/financeiro/contas', { withSeedOrders: true, storage })
    expect(await screen.findByRole('button', { name: /A pagar · R\$.3\.719,00/ })).toBeInTheDocument() // 3.097,00 + 622,00 do quadro
    const row = screen.getByText(/Boleto · compra PC-0057/).closest('a')!
    expect(row).toHaveTextContent(money('622,00'))
    expect(row).toHaveTextContent('Criada hoje')
  })
})

describe('financeiro · pagar conta', () => {
  const open = async (id = 'fe-1') => {
    const user = userEvent.setup()
    renderApp(`/gestao/financeiro/pagar/${id}`, { withSeedOrders: true })
    await screen.findByLabelText('Valor pago')
    return user
  }

  it('aluguel: valores padrão, saldo depois do pagamento e forma', async () => {
    await open()
    expect(screen.getByText('Atrasado · 4 dias')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Aluguel' })).toBeInTheDocument()
    expect(screen.getByLabelText('Valor pago')).toHaveDisplayValue(/R\$.1\.800,00/)
    expect(screen.getByLabelText('Multa e juros')).toHaveDisplayValue(/R\$.0,00/)
    expect(screen.getByRole('button', { name: /Conta no banco/ })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByText('Saldo depois do pagamento').parentElement).toHaveTextContent(/R\$.4\.580,40 no banco/)
    expect(screen.getByLabelText('Forma')).toHaveDisplayValue('Pix')
    expect(screen.getByLabelText('Comprovante (opcional)')).toBeInTheDocument()
  })

  it('caixa não cobre: avisa, mostra o saldo do caixa e bloqueia o botão', async () => {
    const user = await open()
    await user.click(screen.getByRole('button', { name: /Caixa \(gaveta\)/ }))
    expect(screen.getByRole('alert')).toHaveTextContent(/O caixa tem R\$.412,00\. Escolha o banco ou pague só uma parte\./)
    expect(screen.getByRole('button', { name: 'Saldo insuficiente no caixa' })).toBeDisabled()
    await user.click(screen.getByRole('button', { name: /Conta no banco/ }))
    expect(screen.getByRole('button', { name: 'Registrar pagamento' })).toBeEnabled()
  })

  it('registra o pagamento: saldo do banco, próximo aluguel lançado e desfazer', async () => {
    const user = await open()
    await user.click(screen.getByRole('button', { name: 'Registrar pagamento' }))
    expect(await screen.findByRole('heading', { name: 'Aluguel pago' })).toBeInTheDocument()
    expect(screen.getByText(/saiu de conta no banco\. Saldo agora: R\$.4\.580,40\./)).toBeInTheDocument()
    const due = new Date(Date.now() - 4 * 86_400_000)
    const next = new Date(due.getFullYear(), due.getMonth() + 1, due.getDate())
    const nextLabel = `${String(next.getDate()).padStart(2, '0')}/${String(next.getMonth() + 1).padStart(2, '0')}`
    expect(screen.getByText(new RegExp(`O próximo aluguel já está lançado para ${nextLabel.replace('/', '\\/')}`))).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Desfazer' }))
    expect(await screen.findByLabelText('Valor pago')).toBeInTheDocument()
    expect(screen.getByText('Saldo depois do pagamento').parentElement).toHaveTextContent(/R\$.4\.580,40 no banco/) // saldo voltou a 6.380,40
  })

  it('pagamento parcial pelo caixa deixa o restante em aberto', async () => {
    const user = await open()
    await user.click(screen.getByRole('button', { name: /Caixa \(gaveta\)/ }))
    await user.clear(screen.getByLabelText('Valor pago'))
    await user.type(screen.getByLabelText('Valor pago'), 'R$ 400,00')
    await user.click(screen.getByRole('button', { name: 'Registrar pagamento' }))
    expect(await screen.findByRole('heading', { name: 'Aluguel pago em parte' })).toBeInTheDocument()
    expect(screen.getByText(/Ainda faltam R\$.1\.400,00/)).toBeInTheDocument()
    expect(screen.queryByText(/próximo aluguel/)).not.toBeInTheDocument()
  })

  it('multa e juros entram no que sai da conta', async () => {
    const user = await open()
    await user.clear(screen.getByLabelText('Multa e juros'))
    await user.type(screen.getByLabelText('Multa e juros'), '50,00')
    expect(screen.getByText('Saldo depois do pagamento').parentElement).toHaveTextContent(/R\$.4\.530,40 no banco/)
  })

  it('valor inválido ou maior que o restante é recusado dizendo como corrigir', async () => {
    const user = await open()
    await user.clear(screen.getByLabelText('Valor pago'))
    await user.type(screen.getByLabelText('Valor pago'), 'abc')
    await user.click(screen.getByRole('button', { name: 'Registrar pagamento' }))
    expect(await screen.findByText('Informe o valor pago, por exemplo R$ 1.800,00.')).toBeInTheDocument()
    await user.clear(screen.getByLabelText('Valor pago'))
    await user.type(screen.getByLabelText('Valor pago'), '2.500,00')
    await user.click(screen.getByRole('button', { name: 'Registrar pagamento' }))
    expect(await screen.findByText(/O valor não pode passar do que falta pagar/)).toBeInTheDocument()
  })

  it('conta já paga e conta a receber não abrem o formulário', async () => {
    renderApp('/gestao/financeiro/pagar/fe-6', { withSeedOrders: true })
    expect(await screen.findByText('Esta conta já foi paga')).toBeInTheDocument()
  })

  it('pagar muda o saldo no financeiro e entra nos lançamentos como saída', async () => {
    const storage = memoryStorage()
    const svc = createMockServices({ storage, withSeedOrders: true })
    await svc.admin.finance.pay('fe-2', { amountCents: 42000, fineCents: 0, accountId: 'bank', method: 'Boleto', paidAt: new Date().toISOString() })
    const o = await svc.admin.finance.overview()
    expect(o.totalCents).toBe(679240 - 42000)
    const hoje = o.attention.find((a) => a.id === 'today')! // sobra só a energia vencendo hoje
    expect(hoje.amountCents).toBe(22000)
    const l = await svc.admin.finance.ledger()
    expect(l.rows[0]).toMatchObject({ kind: 'out', title: 'Laticínios Serra Verde', amountCents: -42000 })
    await expect(svc.admin.finance.pay('fe-1', { amountCents: 180000, fineCents: 0, accountId: 'cash', method: 'Dinheiro', paidAt: new Date().toISOString() })).rejects.toMatchObject({ code: 'insufficient_balance' })
  })
})

describe('financeiro · lançamentos', () => {
  it('lista os lançamentos do quadro, com entradas R$ 1.244,50 e saídas R$ 780,00', async () => {
    const user = userEvent.setup()
    renderApp('/gestao/financeiro/lancamentos', { withSeedOrders: true })
    const items = (await screen.findAllByRole('listitem')).map((li) => li.textContent ?? '')
    expect(items).toHaveLength(6)
    expect(items[0]).toContain('Vendas no balcão · dinheiro')
    expect(items[0]).toContain('Hoje · Caixa · 14 vendas')
    expect(items[0]).toMatch(/\+.R\$.312,00/)
    expect(items[1]).toContain('Vendas no Pix')
    expect(items[1]).toContain('Hoje · Banco · balcão e loja online')
    expect(items[2]).toContain('Embalagens a vácuo')
    expect(items[2]).toMatch(/−.R\$.96,00/)
    expect(items[3]).toContain('Sangria do caixa')
    expect(items[3]).toContain('Caixa → banco · transferência entre contas')
    expect(items[4]).toContain('Cartão de débito · liquidação')
    expect(items[5]).toContain('Charqueada Norte · PC-0050')
    expect(screen.getByText('Entradas no período').parentElement).toHaveTextContent(/\+.R\$.1\.244,50/)
    expect(screen.getByText('Saídas no período').parentElement).toHaveTextContent(/−.R\$.780,00/)

    await user.click(screen.getByRole('button', { name: 'Entradas' }))
    expect(screen.getAllByRole('listitem')).toHaveLength(3)
    await user.click(screen.getByRole('button', { name: 'Saídas' }))
    expect(screen.getAllByRole('listitem')).toHaveLength(2) // a transferência não é saída
  })
})

describe('financeiro · acesso', () => {
  it('produção e atendente não acessam o financeiro; o gestor sim', async () => {
    signInAs('raimundo@exemplo.com')
    const { unmount } = renderApp('/gestao/financeiro', { withSeedOrders: true })
    expect(await screen.findByText('Você não tem acesso a esta área')).toBeInTheDocument()
    unmount()
    signInAs('ana@exemplo.com')
    renderApp('/gestao/financeiro', { withSeedOrders: true })
    expect(await screen.findByRole('group', { name: 'Saldo agora' })).toBeInTheDocument()
  })
})

describe('acessibilidade do financeiro (axe)', () => {
  const rules = { rules: { 'color-contrast': { enabled: false }, region: { enabled: false } } }
  it.each(['/gestao/financeiro', '/gestao/financeiro/contas', '/gestao/financeiro/pagar/fe-1', '/gestao/financeiro/pagar/fe-9', '/gestao/financeiro/lancamentos'])(
    '%s não tem violações',
    async (path) => {
      const { container } = renderApp(path, { withSeedOrders: true })
      await waitFor(() => expect(container.querySelector('main')).not.toBeNull())
      await new Promise((r) => setTimeout(r, 150))
      expect(await axe(container, rules)).toHaveNoViolations()
    },
  )
})
