import { useRef, useState } from 'react'
import { Button } from '@/components/Button'
import { Banner } from '@/components/Feedback'
import { TextField } from '@/components/Field'
import { photoErrorMessage, uploadProductPhoto, validPhotoUrl } from '@/lib/productPhoto'
import o from '@/styles/ops.module.css'
import s from './PhotoField.module.css'

/** Foto do produto: enviar um arquivo, colar um endereço (https) ou tirar a foto */
export function PhotoField({ value, onChange }: { value: string | null; onChange: (url: string | null) => void }) {
  const input = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [problem, setProblem] = useState<string>()
  const [byUrl, setByUrl] = useState(false)
  const [url, setUrl] = useState('')
  const [broken, setBroken] = useState(false)

  const pick = async (file: File | undefined) => {
    if (!file) return
    setBusy(true)
    setProblem(undefined)
    try {
      onChange(await uploadProductPhoto(file))
      setBroken(false)
    } catch (e) {
      setProblem(photoErrorMessage(e))
    } finally {
      setBusy(false)
      if (input.current) input.current.value = ''
    }
  }

  const useUrl = () => {
    if (!validPhotoUrl(url)) return setProblem('Cole o endereço completo da imagem, começando com https://')
    setProblem(undefined)
    setBroken(false)
    onChange(url.trim())
    setByUrl(false)
    setUrl('')
  }

  return (
    <section className={o.section} aria-label="Foto do produto">
      <h2 className={o.caps}>Foto do produto</h2>
      <div className={s.preview}>
        {value && !broken ? (
          <img src={value} alt="Foto do produto" onError={() => setBroken(true)} />
        ) : (
          <span className={s.empty}>{broken ? 'Essa imagem não abriu. Troque a foto.' : 'Sem foto. A loja mostra um espaço vazio.'}</span>
        )}
      </div>
      <input ref={input} type="file" accept="image/jpeg,image/png,image/webp" aria-label="Escolher arquivo da foto" className="sr-only" onChange={(e) => void pick(e.target.files?.[0])} />
      <div className={s.actions}>
        <Button variant="secondary" loading={busy} disabled={busy} onClick={() => input.current?.click()}>
          {value ? 'Trocar foto' : 'Enviar foto'}
        </Button>
        <Button variant="quiet" disabled={busy} onClick={() => setByUrl((v) => !v)}>
          Usar um endereço (link)
        </Button>
        {value && (
          <Button variant="quiet" disabled={busy} onClick={() => onChange(null)}>
            Remover foto
          </Button>
        )}
      </div>
      {byUrl && (
        <div className={s.urlRow}>
          <TextField label="Endereço da imagem" type="url" inputMode="url" placeholder="https://…" value={url} onChange={(e) => setUrl(e.target.value)} help="Link direto de uma imagem (termina em .jpg, .png ou .webp)." />
          <Button onClick={useUrl}>Usar esta imagem</Button>
        </div>
      )}
      {problem && <Banner tone="error">{problem}</Banner>}
      <p className={o.muted}>JPG, PNG ou WebP até 15 MB. A foto é reduzida sozinha. Clique em Salvar para guardar.</p>
    </section>
  )
}
