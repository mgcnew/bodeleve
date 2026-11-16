import { ButtonLink } from '@/components/Button'
import { Icon } from '@/components/Icon'
import { establishment } from '@/mocks/establishment'
import { TopBar } from '../components/LojaShell'
import { ProductPhoto } from '../components/ProductCard'
import l from '../loja.module.css'
import s from './Institucional.module.css'

const kinds = [
  { title: 'Feito na casa', text: 'Produtos preparados aqui, em pequenos lotes.', bg: 'var(--cor-verde)', fg: 'var(--superficie)' },
  { title: 'Marca Bodeleve', text: 'A linha que leva o nome da casa.', bg: 'var(--cor-terracota)', fg: 'var(--superficie)' },
  {
    title: 'Escolhidos pela casa',
    text: 'Produtos regionais de fornecedores selecionados.',
    bg: 'var(--superficie)',
    fg: 'var(--texto)',
    border: '1px solid var(--linha)',
  },
]

export function Sobre() {
  return (
    <div className={`${l.screen} ${l.narrow}`}>
      <TopBar back="history" />
      <main className={l.main} style={{ paddingTop: 4 }}>
        <ProductPhoto className={s.housePhoto} white label="[FOTO DA CASA]" />
        <div className={l.stack}>
          <div className={`${l.eyebrow} ${s.eyebrowBrand}`}>Sobre a Bodeleve</div>
          <h1 className={s.aboutTitle}>Uma {establishment.tagline}</h1>
          <p className={l.secondary}>{establishment.history}</p>
        </div>

        <section className={l.stack12}>
          <h2 className={l.h2}>O que você encontra aqui</h2>
          {kinds.map((k) => (
            <div key={k.title} className={s.kind} style={{ background: k.bg, color: k.fg, border: 'border' in k ? k.border : undefined }}>
              <div className={s.kindTitle}>{k.title}</div>
              <div className={s.kindText}>{k.text}</div>
            </div>
          ))}
        </section>

        <section className={l.card} style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: 16 }}>
          <h2 className={l.h2}>Venha conhecer</h2>
          <div className={s.contactRow}>
            <Icon name="local" size={20} />
            <span>{establishment.address}</span>
          </div>
          <div className={s.contactRow}>
            <Icon name="historico" size={20} />
            <span>{establishment.hours}</span>
          </div>
        </section>
      </main>
      <div className={l.footer}>
        <ButtonLink to="/" size="l" block>
          Ver produtos
        </ButtonLink>
      </div>
    </div>
  )
}
