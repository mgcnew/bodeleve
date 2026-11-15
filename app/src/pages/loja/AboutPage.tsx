import { ButtonLink, Icon } from '@/components'
import { useStoreContent } from '@/ui/loja/queries'
import { Footer, ScreenHeader, Section } from '@/ui/loja/parts'
import { Photo } from '@/ui/loja/Photo'
import s from '@/ui/loja/loja.module.css'

const offers = [
  ['Feito na casa', 'Produtos preparados aqui, em pequenos lotes.'],
  ['Marca Bodeleve', 'A linha que leva o nome da casa.'],
  ['Escolhidos pela casa', 'Produtos regionais de fornecedores selecionados.'],
] as const

export function AboutPage() {
  const content = useStoreContent()
  return (
    <>
      <ScreenHeader back="/" bag />
      <main className={s.main} style={{ gap: 24 }}>
        <Photo height={220} />
        <div className={s.stack} style={{ gap: 8 }}>
          <div className={s.heroEyebrow} style={{ color: 'var(--cor-terracota)' }}>Sobre a Bodeleve</div>
          <h1 className={s.h1} style={{ fontSize: 28, lineHeight: '34px' }}>Uma Casa do Norte</h1>
          <p style={{ font: 'var(--corpo)' }}>{content.data?.aboutHistory}</p>
        </div>
        <Section title="O que você encontra aqui">
          {offers.map(([t, d]) => (
            <div key={t} className={s.card} style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 4 }}>
              <div className={s.strong}>{t}</div>
              <div className={s.sub}>{d}</div>
            </div>
          ))}
        </Section>
        <section className={s.card} style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }} aria-labelledby="venha-t">
          <h2 id="venha-t" className={s.h2}>Venha conhecer</h2>
          <div className={s.cardRow}><Icon name="local" size={20} /><span>{content.data?.address}</span></div>
          <div className={s.cardRow}><Icon name="historico" size={20} /><span>{content.data?.hours}</span></div>
        </section>
      </main>
      <Footer>
        <ButtonLink href="/buscar" size="lg" fullWidth>Ver produtos</ButtonLink>
      </Footer>
    </>
  )
}
