import { useState } from 'react'
import { AppLink, Banner, Button, Chip, EmptyState, Icon, ListSkeleton, StatusTag } from '@/components'
import { useServices } from '@/services'
import type { CourierCardView } from '@/services/types'
import { useCourierSession } from '@/store/courier'
import { useCourierList, useInvalidateCourier } from '@/ui/entregas/queries'
import { QueryBoundary } from '@/ui/loja/parts'
import s from '@/ui/gestao/gestao.module.css'
import l from '@/ui/loja/loja.module.css'

const num = { fontVariantNumeric: 'tabular-nums' } as const

function Facts({ c }: { c: CourierCardView }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 8 }}>
      <div className={l.sub}>Distância<div style={{ font: 'var(--corpo)', fontWeight: 700, color: 'var(--texto)' }}>{c.km ?? '—'}</div></div>
      <div className={l.sub}>Itens<div style={{ font: 'var(--corpo)', fontWeight: 700, color: 'var(--texto)', ...num }}>{c.items}</div></div>
      <div className={l.sub}>{c.valueLabel}<div style={{ font: 'var(--corpo)', fontWeight: 700, color: 'var(--texto)', ...num }}>{c.value}</div></div>
    </div>
  )
}

export function CourierListPage() {
  const { admin } = useServices()
  const courierId = useCourierSession((x) => x.courierId)!
  const invalidate = useInvalidateCourier()
  const query = useCourierList()
  const [picked, setPicked] = useState<'available' | 'mine' | null>(null)
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState<string | null>(null)

  const take = async (c: CourierCardView, partner: boolean) => {
    setBusy(c.orderId)
    setError('')
    try {
      await admin.courier.take(courierId, c.orderId)
      await invalidate()
      setPicked('mine')
      setNotice(partner ? `A entrega #${c.orderId} é sua. Aceite para a loja saber.` : `A entrega #${c.orderId} é sua. Aceite para a loja saber.`)
    } catch {
      setError('Outra pessoa já pegou esta entrega. A lista foi atualizada.')
      await invalidate()
    }
    setBusy(null)
  }

  return (
    <>
      <QueryBoundary query={query} skeleton={<ListSkeleton rows={2} label="Carregando entregas" />} errorTitle="Não foi possível carregar as entregas">
        {(d) => {
          const partner = d.profile.kind === 'partner'
          const tab = picked ?? (d.mine.length > 0 ? 'mine' : 'available')
          const shown = tab === 'mine' ? d.mine : d.available
          return (
            <>
              <header className={s.header} style={{ alignItems: 'center' }}>
                <div>
                  <h1 className={s.title} style={{ margin: 0 }}>Entregas</h1>
                  <div className={s.date}>{d.profile.name} · {partner ? 'parceiro' : 'entregador da casa'}</div>
                </div>
                <StatusTag tone={d.profile.available ? 'success' : 'neutral'}>{d.profile.available ? 'Disponível' : 'Fora do turno'}</StatusTag>
              </header>
              <main className={s.main} style={{ gap: 16, paddingTop: 8 }}>
                <div role="group" aria-label="Lista" className={s.filters}>
                  <Chip selected={tab === 'available'} onClick={() => setPicked('available')}>Disponíveis · {d.available.length}</Chip>
                  <Chip selected={tab === 'mine'} onClick={() => setPicked('mine')}>Minhas · {d.mine.length}</Chip>
                </div>
                {!d.profile.available && <Banner tone="warning">Você está fora do turno. Ligue “Disponível para entregas” no Perfil para ver e pegar entregas.</Banner>}
                <div role="status" aria-live="polite">{notice && <Banner tone="success">{notice}</Banner>}</div>
                {error && <Banner tone="error">{error}</Banner>}
                {shown.length === 0 ? (
                  <EmptyState icon="entregas" title={tab === 'mine' ? 'Nenhuma entrega com você' : 'Nada disponível agora'} description={tab === 'mine' ? 'Quando o balcão atribuir ou você pegar uma, ela aparece aqui.' : partner ? 'Quando a casa publicar uma entrega, ela aparece aqui.' : 'Pedidos prontos sem entregador aparecem aqui.'} />
                ) : (
                  shown.map((c) => {
                    const body = (
                      <>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                          <b>Pedido #{c.orderId}</b>
                          <StatusTag tone={c.state === 'en_route' ? 'info' : c.state === 'free' || c.state === 'published' ? 'success' : 'neutral'}>{c.tag}</StatusTag>
                        </div>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                          <Icon name="local" size={20} />
                          <div>
                            <b>{c.district}</b>
                            <div className={l.sub}>{c.street}</div>
                          </div>
                        </div>
                        <Facts c={c} />
                      </>
                    )
                    const card = { display: 'flex', flexDirection: 'column', gap: 12, padding: 16, borderRadius: 12, border: '1px solid var(--linha)', background: 'var(--superficie)', color: 'var(--texto)', textDecoration: 'none' } as const
                    return tab === 'mine' ? (
                      <AppLink key={c.orderId} href={`/entregas/pedido/${c.orderId}`} style={card}>{body}</AppLink>
                    ) : (
                      <div key={c.orderId} style={card}>
                        {body}
                        <div className={l.sub}>{c.detail}</div>
                        <Button size="lg" fullWidth loading={busy === c.orderId} onClick={() => take(c, partner)}>{partner ? `Aceitar por ${c.value}` : 'Pegar esta entrega'}</Button>
                      </div>
                    )
                  })
                )}
                <div className={l.sub}>{partner ? 'Como parceiro, você vê só as entregas que a casa publicou e recebe por entrega.' : 'Como entregador da casa, você recebe as entregas que o balcão atribui e pode pegar as que estão livres.'}</div>
              </main>
            </>
          )
        }}
      </QueryBoundary>
    </>
  )
}
