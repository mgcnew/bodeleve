import { beforeEach, describe, expect, it, vi } from 'vitest'
import { act, screen, waitFor } from '@testing-library/react'
import { adminUsers } from '@/mocks/adminSeed'
import { createMockServices } from '@/mocks/services'
import { useAdminSession } from '@/store/admin'
import { useCourierSession } from '@/store/courier'
import { memoryStorage, renderApp, resetStores } from '@/test/renderApp'

beforeEach(() => {
  resetStores()
  window.scrollTo = vi.fn()
})

/** Outra aba ou aparelho gravou no mesmo armazenamento: o navegador avisa as demais com o evento `storage`. */
const otherTabChanged = () => act(async () => { window.dispatchEvent(new StorageEvent('storage', { key: 'bodeleve.mock.db' })); await new Promise((r) => setTimeout(r, 400)) })

describe('atualização ao vivo (simulada)', () => {
  it('pedido novo da loja aparece na fila da gestão sem recarregar', async () => {
    const u = adminUsers.find((x) => x.email === 'ana@exemplo.com')!
    useAdminSession.setState({ user: { id: u.id, name: u.name, email: u.email, role: u.role } })
    const storage = memoryStorage()
    renderApp('/gestao/pedidos', { withSeedOrders: true, storage })
    expect(await screen.findByText(/Maria Lima/)).toBeInTheDocument()
    expect(screen.queryByText(/Lúcia Prado/)).not.toBeInTheDocument()
    const loja = createMockServices({ storage, withSeedOrders: true, code: () => '1234' })
    await loja.orders.placeOrder({ items: [{ productId: 'queijo-coalho', qty: 1 }], fulfillment: 'pickup', contact: { name: 'Lúcia Prado', phone: '(00) 90000-0099' }, address: null, windowId: 'asap', payment: { method: 'pix', changeForCents: null } })
    await otherTabChanged()
    expect(await screen.findByText(/Lúcia Prado/)).toBeInTheDocument()
  })

  it('entrega publicada para parceiros aparece para o parceiro com o app aberto', async () => {
    useCourierSession.setState({ courierId: 'diego' })
    const storage = memoryStorage()
    renderApp('/entregas', { withSeedOrders: true, storage })
    expect(await screen.findByText('Nada disponível agora')).toBeInTheDocument()
    const gestao = createMockServices({ storage, withSeedOrders: true }).admin
    const o = (await gestao.orders.get('1041'))!
    await gestao.orders.markReady('1041', o.items.map((i) => i.productId))
    await gestao.deliveries.assign('1041', 'partners')
    await otherTabChanged()
    expect(await screen.findByText('Pedido #1041')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Disponíveis · 1' })).toBeInTheDocument()
  })

  it('o que a loja vê muda quando o status do pedido muda em outra aba', async () => {
    const storage = memoryStorage()
    const { container } = renderApp('/pedidos/1042', { withSeedOrders: true, storage })
    await screen.findByText(/com Carlos, entregador da casa/)
    expect(container.querySelector('[aria-current="step"]')).not.toBeNull() // ainda a caminho
    const gestao = createMockServices({ storage, withSeedOrders: true }).admin
    await gestao.courier.confirm('carlos', '1042', '4821')
    await otherTabChanged()
    await waitFor(() => expect(container.querySelector('[aria-current="step"]')).toBeNull()) // todas as etapas concluídas
  })

  it('mudança que não vem de outra aba não dispara nada (sem evento, sem atualização)', async () => {
    const u = adminUsers.find((x) => x.email === 'ana@exemplo.com')!
    useAdminSession.setState({ user: { id: u.id, name: u.name, email: u.email, role: u.role } })
    const storage = memoryStorage()
    renderApp('/gestao/pedidos', { withSeedOrders: true, storage })
    await screen.findByText(/Maria Lima/)
    const loja = createMockServices({ storage, withSeedOrders: true, code: () => '1234' })
    await loja.orders.placeOrder({ items: [{ productId: 'queijo-coalho', qty: 1 }], fulfillment: 'pickup', contact: { name: 'Lúcia Prado', phone: '(00) 90000-0099' }, address: null, windowId: 'asap', payment: { method: 'pix', changeForCents: null } })
    await act(async () => { await new Promise((r) => setTimeout(r, 400)) })
    expect(screen.queryByText(/Lúcia Prado/)).not.toBeInTheDocument()
  })
})
