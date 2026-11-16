import { useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { backofficeErrorMessage } from '@/services/gestao/backofficeRemote'
import { EmptyState } from '@/components/Feedback'
import { ButtonLink } from '@/components/Button'
import { Tag } from '@/components/Badges'
import { Box } from '@/components/Card'
import { Button } from '@/components/Button'
import { Banner } from '@/components/Feedback'
import { SelectField, TextField } from '@/components/Field'
import { QuantityStepper } from '@/components/QuantityStepper'
import { formatQty } from '@/domain/backoffice'
import { daysFromToday } from '@/domain/dates'
import { formatCents } from '@/domain/money'
import { itemsStore, purchasesStore, stockStore, suppliersStore } from '@/services/gestao/backoffice'
import { staffOrdersStore } from '@/services/gestao/orders'
import { createPurchase } from '@/services/gestao/purchases'
import { balanceOf } from '@/services/gestao/stock'
import o from '@/styles/ops.module.css'
import { Bar, SumRow, SumTotal } from '../../../shared/OpsBits'

// o banco aceita estas três condições; a de 21 dias só existe nos dados de exemplo
const paymentOptions = supabase ? ['Boleto, 14 dias após receber', 'Pix na entrega', 'Dinheiro na entrega'] : ['Boleto, 14 dias após receber', 'Boleto, 21 dias após receber', 'Pix na entrega', 'Dinheiro na entrega']

export function CompraNova() {
  const [params] = useSearchParams()
  const suppliers = suppliersStore.useStore()
  const items = itemsStore.useStore()
  const { movements } = stockStore.useStore()
  const orders = staffOrdersStore.useStore()
  const purchases = purchasesStore.useStore()
  const navigate = useNavigate()

  // a lista de fornecedores pode chegar depois da tela: enquanto nada foi escolhido vale o primeiro
  const [chosen, setSupplierId] = useState(params.get('fornecedor') ?? '')
  const supplierId = chosen || suppliers[0]?.id || ''
  const supplier = suppliers.find((s) => s.id === supplierId) ?? suppliers[0]
  const supplied = useMemo(() => items.filter((i) => i.supplierId === supplierId), [items, supplierId])

  // H-G7 — sugere quantidades pelo estoque mínimo
  const suggestion = useMemo(() => {
    const out: Record<string, number> = {}
    for (const it of supplied) {
      const b = balanceOf(it.id, { movements, orders, purchases })
      out[it.id] = b.projected < it.minStock ? Math.ceil(it.minStock * 2 - b.projected) : 0
    }
    return out
  }, [supplied, movements, orders, purchases])

  const [qty, setQty] = useState<Record<string, Record<string, number>>>({})
  const current = qty[supplierId] ?? suggestion
  const setItemQty = (id: string, q: number) => setQty((all) => ({ ...all, [supplierId]: { ...current, [id]: q } }))

  const [expected, setExpected] = useState(daysFromToday(4).slice(0, 10))
  const [paymentChoice, setPayment] = useState<string | null>(null)
  // por padrão, a condição do fornecedor; só sai disso se a pessoa escolher outra
  const supplierDefault = supplier?.paymentDays ? 'Boleto, 14 dias após receber' : supplier?.paymentTerms?.toLowerCase().includes('dinheiro') ? 'Dinheiro na entrega' : 'Pix na entrega'
  const payment = paymentChoice && paymentOptions.includes(paymentChoice) ? paymentChoice : supplierDefault
  const [error, setError] = useState(false)
  const [busy, setBusy] = useState(false)
  const [problem, setProblem] = useState<string>()

  const lines = supplied.filter((i) => (current[i.id] ?? 0) > 0)
  const totalQty = lines.reduce((n, i) => n + current[i.id], 0)
  const total = lines.reduce((n, i) => n + current[i.id] * i.costCents, 0)

  const send = async () => {
    if (lines.length === 0) {
      setError(true)
      return
    }
    setBusy(true)
    setProblem(undefined)
    try {
      const when = new Date(`${expected}T12:00:00`)
      // `{number}` é trocado pelo banco pelo número do pedido criado (e por nós, abaixo, na mensagem do WhatsApp)
      const message = [`Olá, ${supplier.contactName}! Pedido {number} da Bodeleve:`, ...lines.map((i) => `• ${current[i.id]} × ${i.name}`), `Previsão: ${when.toLocaleDateString('pt-BR')}`, `Pagamento: ${payment}`].join('\n')
      const p = await createPurchase(
        {
          supplierId,
          expectedAt: when.toISOString(),
          paymentTerms: payment,
          items: lines.map((i) => ({ itemId: i.id, name: i.name, qty: current[i.id], unitCostCents: i.costCents, receivedQty: 0 })),
        },
        message,
      )
      navigate(`/gestao/compras/${p.id}`, { replace: true })
    } catch (e) {
      setProblem(backofficeErrorMessage(e))
      setBusy(false)
    }
  }

  if (!supplier) {
    return (
      <div className={o.screen}>
        <Bar title="Novo pedido de compra" back="/gestao/compras" />
        <EmptyState bare icon="compras" title="Nenhum fornecedor cadastrado" text="Cadastre um fornecedor para poder fazer pedidos de compra." action={<ButtonLink to="/gestao/fornecedores">Ver fornecedores</ButtonLink>} />
      </div>
    )
  }

  return (
    <div className={o.screen}>
      <Bar title="Novo pedido de compra" back="/gestao/compras" />
      <main className={`${o.main} ${o.mainTop} ${o.narrow}`}>
        <SelectField
          label="Fornecedor"
          value={supplierId}
          onChange={(e) => {
            setSupplierId(e.target.value)
            setPayment(null)
            setError(false)
          }}
          options={suppliers.map((s) => ({ value: s.id, label: s.name }))}
        />
        <section className={o.section} style={{ gap: 4 }}>
          <div className={o.cardHead} style={{ alignItems: 'baseline' }}>
            <h2 className={o.h2}>Itens</h2>
            <span className={o.muted}>Sugestão pelo estoque mínimo</span>
          </div>
          <Box>
            {supplied.length === 0 && <p className={o.muted} style={{ padding: '12px 0' }}>Nenhum item cadastrado para este fornecedor.</p>}
            {supplied.map((it) => {
              const b = balanceOf(it.id, { movements, orders, purchases })
              const low = b.available < it.minStock
              const q = current[it.id] ?? 0
              return (
                <div key={it.id} style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: '14px 0', borderBottom: '1px solid var(--linha)' }}>
                  <div className={o.cardHead} style={{ alignItems: 'flex-start' }}>
                    <div>
                      <div className={o.bold}>{it.name}</div>
                      <div className={`${o.small} ${o.num}`}>
                        Estoque {formatQty(b.available, it.unit)} · {low ? `mínimo ${it.minStock}` : 'ok'} · último custo {formatCents(it.costCents)}
                      </div>
                    </div>
                    {low && <Tag tone="warning">Estoque baixo</Tag>}
                  </div>
                  <div className={o.cardHead}>
                    <QuantityStepper label={`Quantidade de ${it.name}`} value={q} onChange={(v) => setItemQty(it.id, v)} />
                    <span className={`${o.bold} ${o.num}`}>{formatCents(q * it.costCents)}</span>
                  </div>
                </div>
              )
            })}
          </Box>
        </section>
        <TextField label="Previsão de chegada" type="date" value={expected} onChange={(e) => setExpected(e.target.value)} />
        <SelectField label="Pagamento" value={payment} onChange={(e) => setPayment(e.target.value)} options={paymentOptions.map((p) => ({ value: p, label: p }))} />
        <div className={o.card}>
          <SumRow label="Itens" value={`${totalQty} un`} />
          <SumTotal label="Total previsto" value={formatCents(total)} />
        </div>
        {error && <Banner tone="error">Escolha a quantidade de pelo menos um item.</Banner>}
        {problem && <Banner tone="error">{problem}</Banner>}
      </main>
      <div className={o.footer}>
        <Button size="l" block loading={busy} disabled={busy} onClick={send}>
          Enviar ao fornecedor
        </Button>
        <p className={o.muted} style={{ textAlign: 'center' }}>
          Salva como “Enviado”. Na tela do pedido você manda a mensagem pelo WhatsApp do fornecedor.
        </p>
      </div>
    </div>
  )
}
