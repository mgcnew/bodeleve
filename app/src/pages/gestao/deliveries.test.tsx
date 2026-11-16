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

/** Deixa o pedido 1041 pronto para sair, como no quadro. */
async function readyStorage() {
  const storage = memoryStorage()
  const svc = createMockServices({ storage, withSeedOrders: true })
  const o = (await svc.admin.orders.get('1041'))!
  await svc.admin.orders.markReady('1041', o.items.map((i) => i.productId))
  return storage
}

describe('entregas', () => {
  it('abas com contagem, itens e entregadores', async () => {
    const user = userEvent.setup()
    renderApp('/gestao/entregas', { withSeedOrders: true })
    expect(await screen.findByRole('button', { name: 'Para sair · 2' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'Em rota · 1' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Entregues · 2' })).toBeInTheDocument()
    expect(screen.getByText('#1041 · Paula Reis').closest('div')).toHaveTextContent('Em separação · Bairro Alto · 4,1 km')
    expect(screen.getByText('#1043 · Maria Lima').closest('div')).toHaveTextContent('Aguardando aceite · Centro · 1,8 km')
    await user.click(screen.getByRole('button', { name: 'Em rota · 1' }))
    expect(screen.getByText('#1042 · Ana Souza').closest('div')).toHaveTextContent(/Carlos \(próprio\) · saiu \d\dh\d\d · previsão \d\dh\d\d/)
    await user.click(screen.getByRole('button', { name: 'Entregues · 2' }))
    expect(screen.getByText('#1038 · Rafael Dias').closest('div')).toHaveTextContent('Bruno (próprio) · entregue')
    expect(screen.getByText('#1036 · Paula Reis').closest('div')).toHaveTextContent('Parceiro · entregue')
    const eq = screen.getByRole('region', { name: 'Entregadores' })
    expect(eq).toHaveTextContent(/Carlos\s*Próprio · em rota com #1042, volta \d\dh\d\d/)
    expect(eq).toHaveTextContent('Bruno')
    expect(eq).toHaveTextContent('Próprio · na loja')
    expect(eq).toHaveTextContent('Disponível')
    expect(eq).toHaveTextContent('Avulsos · 2 com o app aberto agora')
  })

  it('o pedido pronto abre o Atribuir; os que ainda não estão prontos não são link', async () => {
    renderApp('/gestao/entregas', { withSeedOrders: true, storage: await readyStorage() })
    const pronto = (await screen.findByText('#1041 · Paula Reis')).closest('a')!
    expect(pronto).toHaveAttribute('href', '/gestao/entregas/atribuir/1041')
    expect(pronto).toHaveTextContent('Pronto')
    expect(screen.getByText('#1043 · Maria Lima').closest('a')).toBeNull()
  })

  it('atribuir: escolhe, envia, mostra o resultado e desfaz', async () => {
    const user = userEvent.setup()
    const storage = await readyStorage()
    renderApp('/gestao/entregas/atribuir/1041', { withSeedOrders: true, storage })
    expect(await screen.findByRole('heading', { name: 'Enviar pedido #1041', level: 1 }).catch(() => null) ?? screen.getByText('Enviar pedido #1041')).toBeTruthy()
    expect(screen.getByText('Paula Reis')).toBeInTheDocument()
    expect(screen.getByText(/Rua do Sol, 88 · Bairro Alto/)).toBeInTheDocument()
    expect(screen.getByText(/4,1 km · 6 itens · pago no Pix/)).toBeInTheDocument()
    const bruno = screen.getByRole('button', { name: /Bruno · próprio/ })
    expect(bruno).toHaveAttribute('aria-pressed', 'true')
    expect(bruno).toHaveTextContent('Na loja agora · sai em seguida')
    expect(screen.getByRole('button', { name: /Carlos · próprio/ })).toHaveTextContent(/Volta às \d\dh\d\d · pode levar junto na próxima saída/)
    expect(screen.getByRole('button', { name: /Publicar para parceiros/ })).toHaveTextContent(/O primeiro que aceitar leva · 2 online.*R\$.9,00/)
    expect(screen.getByText('Entregador próprio recebe por mês; parceiro recebe por entrega, no valor mostrado.')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /Publicar para parceiros/ }))
    expect(screen.getByRole('button', { name: 'Publicar por R$ 9,00' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /Carlos · próprio/ }))
    expect(screen.getByRole('button', { name: 'Reservar para o Carlos' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /Bruno · próprio/ }))
    await user.click(screen.getByRole('button', { name: 'Enviar com o Bruno' }))
    expect(await screen.findByRole('heading', { name: 'Bruno recebeu a entrega' })).toBeInTheDocument()
    expect(screen.getByText('O pedido apareceu no app do Bruno. Quem comprou recebe o aviso quando sair.')).toBeInTheDocument()

    const svc = createMockServices({ storage, withSeedOrders: true })
    const ov = await svc.admin.deliveries.overview()
    expect(ov.couriers.find((c) => c.id === 'bruno')).toMatchObject({ detail: 'Próprio · com #1041, sai em seguida', tag: { label: 'Atribuído' } })
    expect(ov.rows.find((r) => r.orderId === '1041')).toMatchObject({ label: 'Atribuída', detail: 'Bruno (próprio) · aguardando sair' })

    await user.click(screen.getByRole('button', { name: 'Desfazer' }))
    expect(await screen.findByRole('button', { name: /Bruno · próprio/ })).toBeInTheDocument()
    expect((await svc.admin.deliveries.overview()).couriers.find((c) => c.id === 'bruno')?.tag.label).toBe('Disponível')
  })

  it('parceiros: publica pelo valor e o resumo avisa o prazo', async () => {
    const user = userEvent.setup()
    renderApp('/gestao/entregas/atribuir/1041', { withSeedOrders: true, storage: await readyStorage() })
    await user.click(await screen.findByRole('button', { name: /Publicar para parceiros/ }))
    await user.click(screen.getByRole('button', { name: 'Publicar por R$ 9,00' }))
    expect(await screen.findByRole('heading', { name: 'Publicado para parceiros' })).toBeInTheDocument()
    expect(screen.getByText('Avisamos aqui quando um parceiro aceitar. Se ninguém aceitar em 10 min, volta para você.')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Voltar às entregas' })).toHaveAttribute('href', '/gestao/entregas')
  })

  it('pedido ainda não pronto: avisa e o botão fica desligado', async () => {
    renderApp('/gestao/entregas/atribuir/1043', { withSeedOrders: true })
    expect(await screen.findByText(/O pedido ainda não está pronto/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Enviar com o|Reservar para|Publicar por/ })).toBeDisabled()
  })

  it('pedido que não existe ou é retirada mostra aviso', async () => {
    renderApp('/gestao/entregas/atribuir/1040', { withSeedOrders: true })
    expect(await screen.findByText('Pedido não encontrado ou sem entrega')).toBeInTheDocument()
  })

  it('gestor vê o painel; atendente não', async () => {
    const a = renderApp('/gestao/entregas', { withSeedOrders: true })
    expect(await screen.findByRole('button', { name: /Para sair/ })).toBeInTheDocument()
    a.unmount()
    signInAs('julia@exemplo.com')
    renderApp('/gestao/entregas', { withSeedOrders: true })
    expect(await screen.findByText('Você não tem acesso a esta área')).toBeInTheDocument()
  })
})

describe('acessibilidade das entregas (axe)', () => {
  const rules = { rules: { 'color-contrast': { enabled: false }, region: { enabled: false } } }
  it.each(['/gestao/entregas', '/gestao/entregas/atribuir/1043'])('%s não tem violações', async (path) => {
    const { container } = renderApp(path, { withSeedOrders: true })
    await waitFor(() => expect(container.querySelector('main')).not.toBeNull())
    await new Promise((r) => setTimeout(r, 200))
    expect(await axe(container, rules)).toHaveNoViolations()
  })
  it('atribuir com pedido pronto não tem violações', async () => {
    const { container } = renderApp('/gestao/entregas/atribuir/1041', { withSeedOrders: true, storage: await readyStorage() })
    await screen.findByRole('button', { name: /Bruno · próprio/ })
    expect(await axe(container, rules)).toHaveNoViolations()
    expect(within(container).getByRole('button', { name: 'Enviar com o Bruno' })).toBeInTheDocument()
  })
})
