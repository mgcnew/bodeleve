import styles from './Placeholder.module.css'

/** Tela ainda não implementada. `design` aponta o arquivo de referência em design/. */
export function Placeholder({ env, title, design }: { env: string; title: string; design: string }) {
  return (
    <section className={styles.wrap}>
      <span className="legenda">{env}</span>
      <h1 className={styles.title}>{title}</h1>
      <p className={styles.note}>Referência: design/{design}</p>
    </section>
  )
}
