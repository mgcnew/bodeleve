import { Fragment } from 'react'
import s from './MessagePreview.module.css'

/** *negrito* do WhatsApp mostrado como negrito na prévia */
function line(text: string) {
  return text.split(/(\*[^*\n]+\*)/g).map((part, i) =>
    part.length > 2 && part.startsWith('*') && part.endsWith('*') ? <strong key={i}>{part.slice(1, -1)}</strong> : <Fragment key={i}>{part}</Fragment>,
  )
}

/** Prévia do texto que vai para o WhatsApp, num balão parecido com o do aplicativo */
export function MessagePreview({ text }: { text: string }) {
  return (
    <section aria-label="Prévia da mensagem" className={s.wrap}>
      <h2 className={s.title}>Prévia da mensagem</h2>
      <p className={s.help}>É este o texto que vai para o WhatsApp. Ele muda conforme você preenche os dados acima, e no WhatsApp você ainda pode ajustar antes de enviar.</p>
      <div className={s.bubble}>
        {text.split('\n').map((l, i) => (
          <div key={i} className={l ? undefined : s.gap}>
            {l ? line(l) : ' '}
          </div>
        ))}
      </div>
    </section>
  )
}
