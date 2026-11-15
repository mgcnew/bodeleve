import { beforeEach, describe, expect, it, vi } from 'vitest'
import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe } from 'vitest-axe'
import { adminUsers } from '@/mocks/adminSeed'
import { createMockServices } from '@/mocks/services'
import { useAdminSession } from '@/store/admin'
import { memoryStorage, renderApp, resetStores } from '@/test/renderApp'

beforeEach(() => {
  resetStores()
  window.scrollTo = vi.fn()
  const u = adminUsers.find((x) => x.email === 'ana@exemplo.com')!
  useAdminSession.setState({ user: { id: u.id, name: u.name, email: u.email, role: u.role } })
})

const money = (v: string) => new RegExp(`R\\$.${v.replace(/[.,]/g, '\\$&')}`)
const dm = (offsetDays: number) => {
  const d = new Date(Date.now() + offsetDays * 86_400_000)
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`
}

describe('compras', () => {
  it('lista separa em aberto e recebidos, com os valores dos quadros', async () => {
    const user = userEvent.setup()
    renderApp('/gestao/compras', { withSeedOrders: true })
    expect(await screen.findByRole('button', { name: 'Em aberto · 3' })).toHaveAttribute('aria-pressed', 'true')
    const hoje = screen.getByText('PC-0057 · Chega hoje · 3 itens').closest('a')!
    expect(hoje).toHaveTextContent('Laticínios Serra Verde')
    expect(hoje).toHaveTextContent(money('632,40'))
    expect(screen.getByText(`PC-0056 · Chega ${dm(4)} · 4 itens`).closest('a')).toHaveTextContent(money('486,00'))

    await user.click(screen.getByRole('button', { name: 'Recebidos · 4' }))
    expect(screen.getByText(new RegExp(`PC-0054 · Recebido ${dm(-7)} · 4 itens`))).toBeInTheDocument()
    // recebido parcial: o valor é o do que chegou e diz o que faltou
    const parcial = screen.getByText(/PC-0053 · Recebido .* · faltou 1 item/).closest('a')!
    expect(parcial).toHaveTextContent('Recebido parcial')
    expect(parcial).toHaveTextContent(money('420,00'))
  })

  it('novo pedido sugere pelo estoque mínimo, calcula o total e salva como enviado sem enviar de verdade', async () => {
    const user = userEvent.setup()
    const { router } = renderApp('/gestao/compras/novo', { withSeedOrders: true })
    expect(await screen.findByText('Rapadura 400 g')).toBeInTheDocument()
    // estoque 4 · mínimo 12 → repõe até o dobro do mínimo: 20 un; melaço 6 · mínimo 6 → 6 un; açúcar ok → 0
    expect(screen.getByRole('group', { name: 'Quantidade de Rapadura 400 g' })).toHaveTextContent('20')
    expect(screen.getByRole('group', { name: 'Quantidade de Melaço de cana 500 ml' })).toHaveTextContent('6')
    expect(screen.getByRole('group', { name: 'Quantidade de Açúcar mascavo 1 kg' })).toHaveTextContent('0')
    expect(screen.getByText(/Estoque 4 un · mínimo 12 · último custo/)).toBeInTheDocument()
    expect(screen.getByText(/Estoque 10 un · ok/)).toBeInTheDocument()
    // 20 × 7,80 + 6 × 9,50 = 213,00
    expect(screen.getByText('Total previsto').parentElement).toHaveTextContent(money('213,00'))
    expect(screen.getByText('26 un')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Enviar ao fornecedor' }))
    await waitFor(() => expect(router.state.location.pathname).toBe('/gestao/compras/PC-0058'))
    expect(await screen.findByText(/registrado como enviado/)).toBeInTheDocument()
    expect(screen.queryByText(/pelo WhatsApp/)).not.toBeInTheDocument() // nada foi enviado (D21)
  })

  it('trocar o fornecedor troca os itens sugeridos', async () => {
    const user = userEvent.setup()
    renderApp('/gestao/compras/novo', { withSeedOrders: true })
    await screen.findByText('Rapadura 400 g')
    await user.selectOptions(screen.getByLabelText('Fornecedor'), 'moinho')
    expect(await screen.findByText('Tapioca granulada 500 g')).toBeInTheDocument()
    expect(screen.queryByText('Rapadura 400 g')).not.toBeInTheDocument()
  })

  it('não envia pedido sem nenhuma quantidade', async () => {
    const user = userEvent.setup()
    renderApp('/gestao/compras/novo?fornecedor=serra', { withSeedOrders: true })
    await screen.findByText('Leite integral 1 L')
    for (const dec of screen.getAllByRole('button', { name: 'Diminuir' })) {
      while (!(dec as HTMLButtonElement).disabled) await user.click(dec)
    }
    await user.click(screen.getByRole('button', { name: 'Enviar ao fornecedor' }))
    expect(await screen.findByText('Escolha a quantidade de pelo menos um item.')).toBeInTheDocument()
  })

  it('o serviço guarda a mensagem do pedido sem enviar', async () => {
    const svc = createMockServices({ storage: memoryStorage(), withSeedOrders: true })
    const { order, message } = await svc.admin.purchasing.send({
      supplierId: 'engenho', expectedAt: new Date().toISOString(), payment: 'boleto14',
      items: [{ itemId: 'rapadura', qty: 24 }, { itemId: 'melaco-de-cana', qty: 6 }],
    })
    expect(order.id).toBe('PC-0058')
    expect(order.status).toBe('sent')
    expect(order.sentVia).toBe('registered_only')
    expect(message).toContain('• 24 × Rapadura 400 g')
    expect(message).toContain('Boleto, 14 dias após receber')
  })
})

async function fillLots(user: ReturnType<typeof userEvent.setup>) {
  const lots = [['LT-1120', '21/11/2026'], ['RQ-1118', '20/12/2026'], ['NT-1114', '24/11/2026']]
  const cards = ['Leite integral 1 L', 'Requeijão 250 g', 'Nata 200 g']
  for (let i = 0; i < cards.length; i++) {
    const card = screen.getByRole('region', { name: cards[i] })
    await user.type(within(card).getByLabelText('Lote'), lots[i][0])
    await user.type(within(card).getByLabelText('Validade'), lots[i][1])
  }
}

describe('recebimento', () => {
  it('exige lote e validade antes de confirmar e não altera nada se faltar', async () => {
    const user = userEvent.setup()
    const { router } = renderApp('/gestao/compras/PC-0057/receber', { withSeedOrders: true })
    await screen.findByText('Confira cada item com a nota. Informe lote e validade como estão na embalagem.')
    await user.click(screen.getByRole('button', { name: 'Confirmar recebimento' }))
    expect((await screen.findAllByText('Informe o lote como está na embalagem.')).length).toBe(3)
    expect(screen.getAllByText('Informe a validade como está na embalagem.').length).toBe(3)
    expect(router.state.location.pathname).toBe('/gestao/compras/PC-0057/receber')
    expect(screen.queryByText('Recebimento confirmado')).not.toBeInTheDocument()
  })

  it('recebimento completo: entra no estoque, cria a conta de R$ 632,40 e fecha o pedido', async () => {
    const user = userEvent.setup()
    renderApp('/gestao/compras/PC-0057/receber', { withSeedOrders: true })
    await screen.findByText('Valor da nota')
    expect(screen.getByText('Itens completos').parentElement).toHaveTextContent('3 de 3')
    await fillLots(user)
    await user.click(screen.getByRole('button', { name: 'Confirmar recebimento' }))

    expect(await screen.findByRole('heading', { name: 'Recebimento confirmado' })).toBeInTheDocument()
    const entered = screen.getByText('Entrou no estoque').closest('section')!
    expect(within(entered).getByText(/Lote LT-1120 · vence 21\/11\/2026/)).toBeInTheDocument()
    expect(within(entered).getByText('+ 140 un')).toBeInTheDocument()
    const conta = screen.getByText('Conta a pagar criada').closest('section')!
    expect(conta).toHaveTextContent('Laticínios Serra Verde · boleto')
    expect(conta).toHaveTextContent(money('632,40'))
    expect(conta).toHaveTextContent(`Vencimento${dm(14)}/${new Date(Date.now() + 14 * 86_400_000).getFullYear()}`)
    expect(screen.queryByText(/O que fazer\?/)).not.toBeInTheDocument()
  })

  it('recebimento parcial: valor do que chegou, pergunta o que fazer e "encerrar" marca Recebido parcial', async () => {
    const user = userEvent.setup()
    renderApp('/gestao/compras/PC-0057/receber', { withSeedOrders: true })
    await screen.findByText('Valor da nota')
    await fillLots(user)
    const nata = screen.getByRole('region', { name: 'Nata 200 g' })
    await user.click(within(nata).getByRole('button', { name: 'Diminuir' }))
    await user.click(within(nata).getByRole('button', { name: 'Diminuir' }))
    expect(within(nata).getByText('Faltam 2')).toBeInTheDocument()
    expect(screen.getByText('Valor da nota').parentElement).toHaveTextContent(money('622,00'))
    expect(screen.getByText('Itens completos').parentElement).toHaveTextContent('2 de 3')

    await user.click(screen.getByRole('button', { name: 'Confirmar recebimento' }))
    expect(await screen.findByText('Faltaram 2 un de Nata. O que fazer?')).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: 'Manter o restante em aberto no pedido' })).toBeChecked()
    await user.click(screen.getByRole('radio', { name: 'Encerrar o pedido assim' }))
    await user.click(screen.getByRole('button', { name: 'Voltar às compras' }))

    await user.click(await screen.findByRole('button', { name: /Recebidos/ }))
    const card = (await screen.findByText(/PC-0057 · Recebido .* · faltou 1 item/)).closest('a')!
    expect(card).toHaveTextContent('Recebido parcial')
    expect(card).toHaveTextContent(money('622,00'))
  })

  it('manter o restante em aberto deixa o pedido na lista de abertos', async () => {
    const user = userEvent.setup()
    renderApp('/gestao/compras/PC-0057/receber', { withSeedOrders: true })
    await screen.findByText('Valor da nota')
    await fillLots(user)
    await user.click(within(screen.getByRole('region', { name: 'Nata 200 g' })).getByRole('button', { name: 'Diminuir' }))
    await user.click(screen.getByRole('button', { name: 'Confirmar recebimento' }))
    await screen.findByText(/O que fazer\?/)
    await user.click(screen.getByRole('button', { name: 'Voltar às compras' }))
    expect(await screen.findByRole('button', { name: 'Em aberto · 3' })).toBeInTheDocument()
    expect(screen.getByText(/PC-0057 · falta chegar o restante/)).toBeInTheDocument()
  })

  it('corrigir conferência volta ao formulário e o pedido continua aguardando', async () => {
    const user = userEvent.setup()
    renderApp('/gestao/compras/PC-0057/receber', { withSeedOrders: true })
    await screen.findByText('Valor da nota')
    await fillLots(user)
    await user.click(screen.getByRole('button', { name: 'Confirmar recebimento' }))
    await screen.findByText('Recebimento confirmado')
    await user.click(screen.getByRole('button', { name: 'Corrigir conferência' }))
    expect(await screen.findByText('Valor da nota')).toBeInTheDocument()
    expect(screen.queryByText('Recebimento confirmado')).not.toBeInTheDocument()
  })

  it('pedido já recebido não pode ser recebido de novo', async () => {
    renderApp('/gestao/compras/PC-0054/receber', { withSeedOrders: true })
    expect(await screen.findByText('Este pedido já foi recebido')).toBeInTheDocument()
  })
})

describe('fornecedores', () => {
  it('lista com a situação de cada um e busca sem acento', async () => {
    const user = userEvent.setup()
    renderApp('/gestao/fornecedores', { withSeedOrders: true })
    expect(await screen.findByText('Leite, requeijão, nata · 1 pedido chega hoje')).toBeInTheDocument()
    expect(screen.getByText('Farinhas, tapioca, flocão · 1 pedido em aberto')).toBeInTheDocument()
    expect(screen.getByText(`Rapadura, melaço, açúcar · Última compra ${dm(-17)}`)).toBeInTheDocument()
    expect(screen.getByText('4 fornecedores ativos')).toBeInTheDocument()
    await user.type(screen.getByRole('searchbox', { name: 'Buscar fornecedor' }), 'laticinios')
    expect(screen.getByText('Laticínios Serra Verde')).toBeInTheDocument()
    expect(screen.queryByText('Moinho Sertão')).not.toBeInTheDocument()
  })

  it('ficha do fornecedor: produtos, condições, total do ano e últimos pedidos', async () => {
    renderApp('/gestao/fornecedores/engenho', { withSeedOrders: true })
    expect(await screen.findByRole('heading', { name: 'Engenho Boa Vista' })).toBeInTheDocument()
    expect(screen.getByText(/Seu Antônio · \(00\) 90000-0100/)).toBeInTheDocument()
    expect(screen.getByText('Rapadura 400 g')).toBeInTheDocument()
    expect(screen.getByText('Pagamento padrão').parentElement).toHaveTextContent('Boleto, 14 dias')
    expect(screen.getByText(/Comprado em/).parentElement).toHaveTextContent(money('2.946,00')) // quadro
    expect(screen.getByText('Contas em aberto').parentElement).toHaveTextContent('nenhuma')
    expect(screen.getByText('PC-0049').closest('a')).toHaveTextContent(money('236,40'))
    expect(screen.getByText('PC-0038').closest('a')).toHaveTextContent(money('312,00'))
    expect(screen.getByRole('link', { name: 'Novo pedido para este fornecedor' })).toHaveAttribute('href', '/gestao/compras/novo?fornecedor=engenho')
  })

  it('depois de receber, a conta aparece como em aberto na ficha do fornecedor', async () => {
    const svc = createMockServices({ storage: memoryStorage(), withSeedOrders: true })
    const lines = [
      { itemId: 'leite-integral', qty: 140, lot: 'LT-1', expiresAt: new Date(Date.now() + 5 * 86_400_000).toISOString() },
      { itemId: 'requeijao', qty: 20, lot: 'RQ-1', expiresAt: new Date(Date.now() + 30 * 86_400_000).toISOString() },
      { itemId: 'nata', qty: 12, lot: 'NT-1', expiresAt: new Date(Date.now() + 9 * 86_400_000).toISOString() },
    ]
    await svc.admin.purchasing.receive('PC-0057', { lines, closeShort: false })
    const f = await svc.admin.purchasing.getSupplier('serra')
    expect(f?.openPayablesCents).toBe(63240 + 42000) // a conta nova + o boleto do PC-0053 que vence hoje
    expect(f?.openOrders).toBe(0)
  })
})

describe('acessibilidade de compras (axe)', () => {
  const rules = { rules: { 'color-contrast': { enabled: false }, region: { enabled: false } } }
  it.each([
    '/gestao/compras', '/gestao/compras/novo', '/gestao/compras/PC-0057', '/gestao/compras/PC-0057/receber', '/gestao/compras/PC-0054',
    '/gestao/fornecedores', '/gestao/fornecedores/engenho',
  ])('%s não tem violações', async (path) => {
    const { container } = renderApp(path, { withSeedOrders: true })
    await waitFor(() => expect(container.querySelector('main')).not.toBeNull())
    await new Promise((r) => setTimeout(r, 100))
    expect(await axe(container, rules)).toHaveNoViolations()
  })
})
