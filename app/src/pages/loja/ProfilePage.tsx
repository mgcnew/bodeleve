import { Button, ButtonLink } from '@/components'
import { addressLine, validateAddress } from '@/domain/checkout'
import { formatPhone } from '@/domain/checkout'
import { useCheckout, useSession } from '@/store/bag'
import { useStoreContent } from '@/ui/loja/queries'
import { LinkList, TabTitle } from '@/ui/loja/parts'
import s from '@/ui/loja/loja.module.css'

export function ProfilePage() {
  const phone = useSession((x) => x.phone)
  const signOut = useSession((x) => x.signOut)
  const address = useCheckout((c) => c.address)
  const content = useStoreContent()
  const hasAddress = Object.keys(validateAddress(address)).length === 0
  return (
    <>
      <TabTitle>Perfil</TabTitle>
      <main className={s.main} style={{ paddingTop: 8 }}>
        <div className={s.card} style={{ padding: 20, background: 'var(--cor-terracota-suave)', borderColor: 'var(--cor-terracota-suave)', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {phone ? (
            <>
              <div>
                <div className={s.strong} style={{ fontSize: 18 }}>Você está com a conta ativa</div>
                <div className={s.sub} style={{ color: 'var(--texto)' }}>Celular {formatPhone(phone)}</div>
              </div>
              <Button variant="secondary" onClick={signOut}>Sair da conta</Button>
            </>
          ) : (
            <>
              <div>
                <div className={s.strong} style={{ fontSize: 18 }}>Você está comprando sem conta</div>
                <div className={s.sub} style={{ color: 'var(--texto)' }}>Com uma conta você vê seus pedidos em qualquer aparelho e pede de novo em um toque.</div>
              </div>
              <ButtonLink href="/entrar?next=/perfil">Entrar ou criar conta</ButtonLink>
            </>
          )}
        </div>
        <LinkList
          rows={[
            { href: '/pedidos', icon: 'pedidos', title: 'Meus pedidos', detail: 'Acompanhar e pedir de novo' },
            { href: '/finalizar/endereco', icon: 'local', title: 'Endereço de entrega', detail: hasAddress ? addressLine(address).split(' · ')[0] : 'Nenhum endereço salvo' },
          ]}
        />
        <LinkList
          rows={[
            { href: '/linha', icon: 'vender', title: 'Linha Bodeleve', detail: 'Produtos com a marca da casa' },
            { href: '/sobre', icon: 'inicio', title: 'Sobre a Bodeleve', detail: 'A casa, o que produz e onde fica' },
          ]}
        />
        <div className={s.sub}>Atendimento: {content.data?.whatsapp} · {content.data?.hours}</div>
      </main>
    </>
  )
}
