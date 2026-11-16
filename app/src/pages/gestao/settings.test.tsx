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
  signInAs('dono@exemplo.com')
})

describe('configurações', () => {
  it('resumo com a equipe e os pontos que dependem de decisão', async () => {
    renderApp('/gestao/configuracoes', { withSeedOrders: true })
    const casa = (await screen.findByText('A casa', { selector: 'span' })).closest('a')!
    expect(casa).toHaveAttribute('href', '/gestao/configuracoes/casa')
    expect(casa).toHaveTextContent('Nome, endereço, horários, WhatsApp, logotipo')
    const equipe = screen.getByText('Equipe e permissões', { selector: 'span' }).closest('a')!
    expect(equipe).toHaveAttribute('href', '/gestao/configuracoes/equipe')
    expect(equipe).toHaveTextContent('6 pessoas · 5 papéis')
    expect(screen.getByText('Loja online').closest('div')).toHaveTextContent(/Entrega: taxa fixa R\$.8,00 · retirada grátis/)
    expect(screen.getByText('Formas de pagamento').closest('div')).toHaveTextContent('Pix, cartão na entrega, dinheiro')
    expect(screen.getByText('Nota fiscal').closest('div')).toHaveTextContent('Não configurado · aguardando decisão')
    expect(screen.getByText('Loja online, pagamentos e nota fiscal dependem de respostas pendentes (Q6 a Q8 e Q12).')).toBeInTheDocument()
  })

  it('só o dono acessa; gestor e demais não', async () => {
    signInAs('ana@exemplo.com')
    const a = renderApp('/gestao/configuracoes', { withSeedOrders: true })
    expect(await screen.findByText('Você não tem acesso a esta área')).toBeInTheDocument()
    a.unmount()
    renderApp('/gestao/configuracoes/equipe', { withSeedOrders: true })
    expect(await screen.findByText('Você não tem acesso a esta área')).toBeInTheDocument()
  })
})

describe('a casa', () => {
  it('abre com o nome e os marcadores entre colchetes nos campos vazios', async () => {
    renderApp('/gestao/configuracoes/casa', { withSeedOrders: true })
    expect(await screen.findByLabelText('Nome')).toHaveValue('Bodeleve')
    expect(screen.getByLabelText('CNPJ')).toHaveAttribute('placeholder', '[CNPJ]')
    expect(screen.getByLabelText('Endereço')).toHaveAttribute('placeholder', '[ENDEREÇO DA LOJA]')
    expect(screen.getByLabelText('WhatsApp de atendimento')).toHaveAttribute('placeholder', '[WHATSAPP DA LOJA]')
    for (const d of ['Segunda a sexta', 'Sábado', 'Domingo']) expect(screen.getByLabelText(d)).toHaveAttribute('placeholder', '[HORÁRIO]')
    expect(screen.getByText('[LOGO]')).toBeInTheDocument()
    expect(screen.getByText('Logotipo oficial ainda não aprovado. Até lá, a marca aparece só como texto.')).toBeInTheDocument()
  })

  it('salvar mostra o aviso e o que foi preenchido passa a valer na loja; o resto continua marcador', async () => {
    const storage = memoryStorage()
    const user = userEvent.setup()
    renderApp('/gestao/configuracoes/casa', { withSeedOrders: true, storage })
    await user.type(await screen.findByLabelText('Endereço'), 'Rua das Flores, 10')
    await user.type(screen.getByLabelText('Segunda a sexta'), '8h às 18h')
    await user.type(screen.getByLabelText('Sábado'), '8h às 14h')
    await user.click(screen.getByRole('button', { name: 'Salvar' }))
    expect(await screen.findByText('Dados da casa salvos.')).toBeInTheDocument()
    const svc = createMockServices({ storage, withSeedOrders: true })
    const c = await svc.content.getStoreContent()
    expect(c.address).toBe('Rua das Flores, 10')
    expect(c.hours).toBe('Segunda a sexta: 8h às 18h · Sábado: 8h às 14h')
    expect(c.whatsapp).toBe('[WHATSAPP DA LOJA]')
  })

  it('CNPJ, WhatsApp e nome inválidos dizem como corrigir e nada é salvo', async () => {
    const user = userEvent.setup()
    renderApp('/gestao/configuracoes/casa', { withSeedOrders: true })
    await user.clear(await screen.findByLabelText('Nome'))
    await user.type(screen.getByLabelText('CNPJ'), '123')
    await user.type(screen.getByLabelText('WhatsApp de atendimento'), '900')
    await user.click(screen.getByRole('button', { name: 'Salvar' }))
    expect(await screen.findByText('Informe o nome da casa.')).toBeInTheDocument()
    expect(screen.getByText('O CNPJ tem 14 números. Confira e tente de novo.')).toBeInTheDocument()
    expect(screen.getByText('Use o DDD e o número, por exemplo (00) 90000-0000.')).toBeInTheDocument()
    expect(screen.queryByText('Dados da casa salvos.')).not.toBeInTheDocument()
  })
})

describe('equipe e permissões', () => {
  it('lista as seis pessoas com papel e detalhe; o dono aparece como "Você"', async () => {
    renderApp('/gestao/configuracoes/equipe', { withSeedOrders: true })
    const row = async (n: string) => (await screen.findByText(n, { selector: 'span' })).closest('div')!
    expect(await row('[NOME DO DONO]')).toHaveTextContent(/Você\s*Dono/)
    expect(await row('Ana')).toHaveTextContent(/ana@exemplo\.com\s*Gestor/)
    expect(await row('Júlia')).toHaveTextContent(/Balcão\s*Atendente/)
    expect(await row('Seu Raimundo')).toHaveTextContent(/Cozinha\s*Produção/)
    expect(await row('Carlos')).toHaveTextContent(/Próprio\s*Entregador/)
    expect(await row('Bruno')).toHaveTextContent(/Próprio\s*Entregador/)
  })

  it('convidar: abre o formulário, valida e registra sem enviar e-mail', async () => {
    const storage = memoryStorage()
    const user = userEvent.setup()
    renderApp('/gestao/configuracoes/equipe', { withSeedOrders: true, storage })
    await user.click(await screen.findByRole('button', { name: 'Convidar pessoa' }))
    expect(within(screen.getByLabelText('Papel', { selector: 'select' })).getAllByRole('option').map((o) => o.textContent)).toEqual(['Atendente', 'Gestor', 'Produção', 'Entregador'])
    await user.type(screen.getByLabelText('E-mail'), 'nome')
    await user.click(screen.getByRole('button', { name: 'Enviar convite' }))
    expect(await screen.findByText('Informe um e-mail válido, por exemplo nome@exemplo.com.')).toBeInTheDocument()
    await user.clear(screen.getByLabelText('E-mail'))
    await user.type(screen.getByLabelText('E-mail'), 'ana@exemplo.com')
    await user.click(screen.getByRole('button', { name: 'Enviar convite' }))
    expect(await screen.findByText('Essa pessoa já está na equipe.')).toBeInTheDocument()
    await user.clear(screen.getByLabelText('E-mail'))
    await user.type(screen.getByLabelText('E-mail'), 'novo@exemplo.com')
    await user.selectOptions(screen.getByLabelText('Papel', { selector: 'select' }), 'Produção')
    await user.click(screen.getByRole('button', { name: 'Enviar convite' }))
    expect(await screen.findByText(/Convite registrado para novo@exemplo\.com\. O envio do e-mail ainda não está ligado/)).toBeInTheDocument()
    const novo = (await screen.findByText('novo', { selector: 'span' })).closest('div')!
    expect(novo).toHaveTextContent(/Convite pendente\s*Produção/)
    const svc = createMockServices({ storage, withSeedOrders: true })
    expect((await svc.admin.settings.team()).find((m) => m.email === 'novo@exemplo.com')).toMatchObject({ role: 'production', pending: true })
    expect((await svc.admin.settings.overview()).people).toBe(7)
  })

  it('o que cada papel vê muda com o filtro: dono tudo, atendente só pedidos e PDV', async () => {
    const user = userEvent.setup()
    renderApp('/gestao/configuracoes/equipe', { withSeedOrders: true })
    const sec = await screen.findByRole('region', { name: 'O que cada papel vê' })
    expect(within(sec).getAllByText('Vê e usa')).toHaveLength(9)
    await user.click(within(sec).getByRole('button', { name: 'Atendente' }))
    expect(within(sec).getAllByText('Vê e usa')).toHaveLength(2)
    expect(within(sec).getByText('Estoque').closest('div')).toHaveTextContent('Sem acesso')
    expect(within(sec).getByText('Pedidos').closest('div')).toHaveTextContent('Vê e usa')
    await user.click(within(sec).getByRole('button', { name: 'Entregador' }))
    expect(within(sec).getAllByText('Vê e usa')).toHaveLength(1)
    expect(screen.getByText('Papéis fixos nesta versão. Permissão por pessoa fica para depois, se precisar.')).toBeInTheDocument()
  })
})

describe('acessibilidade de configurações (axe)', () => {
  const rules = { rules: { 'color-contrast': { enabled: false }, region: { enabled: false } } }
  it.each(['/gestao/configuracoes', '/gestao/configuracoes/casa', '/gestao/configuracoes/equipe'])('%s não tem violações', async (path) => {
    const { container } = renderApp(path, { withSeedOrders: true })
    await waitFor(() => expect(container.querySelector('main')).not.toBeNull())
    await new Promise((r) => setTimeout(r, 250))
    expect(await axe(container, rules)).toHaveNoViolations()
  })
})
