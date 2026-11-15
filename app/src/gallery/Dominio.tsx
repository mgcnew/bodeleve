import { useState } from 'react'
import {
  ProductCard, BagItem, ValueSummary, FavoriteTile, SaleLine, PaymentMethods, CashClosing, Indicator, StockBalances, LotRow,
  LedgerList, LedgerEntry, OrderTimeline, DeliveryCard, DeliveryStep, ConfirmationCode, Button,
} from '@/components'
import { formatBRL } from '@/lib/format'
import { Section, Panel, Legend } from './parts'
import s from './gallery.module.css'

/* Todos os dados são fictícios (CLAUDE.md): nomes, preços e saldos de exemplo. */
export function Dominio() {
  const [pay, setPay] = useState<string | null>('pix')
  const [fav, setFav] = useState<string | null>(null)
  const [code, setCode] = useState('48')
  return (
    <Section id="dominio" title="Componentes de domínio" note="Produto, estoque, financeiro, venda e entrega. Montados só com os fundamentos e os componentes base. Dados fictícios.">
      <div className={s.grid}>
        <Panel title="Loja" note="Produto, sacola e valores.">
          <Legend>Cartão de produto</Legend>
          <div className={s.cols2}>
            <ProductCard name="Queijo coalho" detail="500 g" priceCents={3290} origin="house" />
            <ProductCard name="Rapadura" detail="400 g" priceCents={1450} origin="brand" />
          </div>
          <Legend>Item na sacola</Legend>
          <BagItem name="Farinha de mandioca" detail={`1 kg · ${formatBRL(1290)}`} trailing="× 2" />
          <Legend>Resumo de valores</Legend>
          <ValueSummary lines={[{ label: 'Subtotal', value: formatBRL(7320) }, { label: 'Entrega (estimada)', value: formatBRL(800) }]} total={{ label: 'Total', value: formatBRL(8120) }} />
        </Panel>

        <Panel title="PDV" note="Velocidade: um toque por item.">
          <Legend>Bloco de favorito</Legend>
          <div className={s.cols2}>
            {[
              ['Queijo coalho', '32,90', '18 un', false], ['Carne de sol', '59,90/kg', '6,4 kg', false], ['Tapioca', '9,90', '3 un', true],
              ['Rapadura', '14,50', '24 un', false], ['Manteiga de garrafa', '28,00', '11 un', false], ['Feijão de corda', '16,90/kg', '9 kg', false],
            ].map(([n, p, st, low]) => (
              <FavoriteTile key={n as string} name={n as string} price={p as string} stock={st as string} lowStock={low as boolean} selected={fav === n} onClick={() => setFav(n as string)} />
            ))}
          </div>
          <Legend>Linha da venda</Legend>
          <SaleLine name="Carne de sol" detail={`0,500 kg × ${formatBRL(5990)}`} totalCents={2995} />
          <Legend>Forma de pagamento</Legend>
          <PaymentMethods value={pay} onChange={setPay} methods={[{ value: 'dinheiro', label: 'Dinheiro' }, { value: 'pix', label: 'Pix' }, { value: 'debito', label: 'Débito' }, { value: 'credito', label: 'Crédito' }]} />
          <Legend>Fechamento de caixa</Legend>
          <CashClosing expectedCents={41200} countedCents={40700} />
        </Panel>

        <Panel title="Gestão" note="O que pede ação hoje.">
          <Legend>Indicador · início da gestão</Legend>
          <div className={s.cols2}>
            <Indicator label="Vendas hoje" value={formatBRL(128450)} caption="balcão 892,00 · internet 392,50" />
            <Indicator label="Pedidos pendentes" value="4" caption="2 novos · 2 em preparo" />
            <Indicator label="Estoque baixo" value="7 itens" caption="ver lista" tone="warning" />
            <Indicator label="A pagar hoje" value={formatBRL(64000)} caption="2 contas" tone="error" />
          </div>
          <Legend>Saldos de estoque</Legend>
          <StockBalances name="Queijo coalho" status={{ label: 'Estoque baixo', tone: 'warning' }} physical="18" reserved="6" available="12" projected="32">
            <LotRow code="Lote QC-1107" info="Validade 19/11/2026 · 8 un" status={{ label: 'Vence em 5 dias', tone: 'warning' }} />
            <LotRow code="Lote QC-1112" info="Validade 02/12/2026 · 10 un" status={{ label: 'No prazo', tone: 'success' }} />
          </StockBalances>
          <Legend>Lançamento financeiro</Legend>
          <LedgerList label="Lançamentos">
            <LedgerEntry title="Laticínios Serra Verde" detail="A pagar · vence hoje" amountCents={-42000} status={{ label: 'Vence hoje', tone: 'warning' }} />
            <LedgerEntry title="Vendas no Pix" detail="Recebido · 13/11" amountCents={39250} status={{ label: 'Pago', tone: 'success' }} />
            <LedgerEntry title="Aluguel" detail="A pagar · venceu 10/11" amountCents={-180000} status={{ label: 'Atrasado', tone: 'error' }} />
          </LedgerList>
          <Legend>Linha do tempo do pedido</Legend>
          <OrderTimeline
            eta="Previsão de entrega: hoje, 15h40"
            steps={[
              { label: 'Pedido recebido', detail: '14h52', state: 'done' },
              { label: 'Em preparo', detail: '14h58', state: 'done' },
              { label: 'Saiu para entrega', detail: 'Agora', state: 'current' },
              { label: 'Entregue', detail: 'Informe o código 4821 ao entregador', state: 'future' },
            ]}
          />
        </Panel>

        <Panel title="Entregas" note="Uma mão, uma ação por etapa.">
          <Legend>Cartão de entrega · entregador</Legend>
          <DeliveryCard
            title="Pedido 1042" courierKind="partner" place="Jardim das Flores" address="Rua das Camélias, 120 · apto 34"
            metrics={[{ label: 'Distância', value: '3,2 km' }, { label: 'Itens', value: '5' }, { label: 'Valor da entrega', value: formatBRL(800) }]}
            action={<Button size="lg" fullWidth>Aceitar entrega</Button>}
          />
          <Legend>Etapa da entrega · uma ação por vez</Legend>
          <DeliveryStep step={3} total={4} title="Em rota para o cliente">
            <Button size="lg" fullWidth>Cheguei ao destino</Button>
            <Button variant="ghost" fullWidth>Problema na entrega</Button>
          </DeliveryStep>
          <Legend>Código de confirmação</Legend>
          <ConfirmationCode value={code} onChange={setCode} />
        </Panel>
      </div>
    </Section>
  )
}
