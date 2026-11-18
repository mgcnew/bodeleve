// Foto do produto: o dono envia um arquivo (reduzido no aparelho antes de subir) ou cola um endereço.
import { supabase } from '@/lib/supabase'
import { getEstablishmentId } from '@/services/gestao/backofficeRemote'

export const PHOTO_BUCKET = 'produtos'
const MAX_FILE_MB = 15
const ACCEPTED = ['image/jpeg', 'image/png', 'image/webp']

/** Só endereços https (a loja é https; endereço sem https o navegador bloquearia) */
export function validPhotoUrl(value: string) {
  try {
    const u = new URL(value.trim())
    return u.protocol === 'https:' && value.trim().length <= 1000
  } catch {
    return false
  }
}

/** Diminui para no máximo `max` px no lado maior e salva como WebP (ou JPEG se o aparelho não souber) */
async function shrink(file: File, max: number, quality: number): Promise<{ blob: Blob; type: string }> {
  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.round(bitmap.width * scale))
  canvas.height = Math.max(1, Math.round(bitmap.height * scale))
  canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  bitmap.close()
  for (const type of ['image/webp', 'image/jpeg']) {
    const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, type, quality))
    if (blob && blob.type === type) return { blob, type }
  }
  throw new Error('invalid_image')
}

export function photoErrorMessage(e: unknown) {
  const msg = String((e as { message?: string })?.message ?? '')
  if (msg === 'invalid_type') return 'Use uma foto JPG, PNG ou WebP.'
  if (msg === 'too_big') return `A foto passa de ${MAX_FILE_MB} MB. Escolha uma menor.`
  if (msg === 'invalid_image') return 'Não foi possível abrir essa imagem. Tente outra.'
  if (msg.includes('row-level security') || msg.includes('Unauthorized') || msg.includes('403')) return 'Seu papel não permite enviar fotos.'
  return 'Não foi possível enviar a foto. Nada foi alterado. Tente de novo.'
}

/**
 * Sobe a foto e devolve o endereço dela.
 * Com o Supabase vai para o armazenamento (`produtos/<casa>/<id>.webp`, público para leitura);
 * sem ele (dados de exemplo) fica guardada no aparelho, menor, só para ver como a loja mostra.
 */
export async function uploadProductPhoto(file: File): Promise<string> {
  if (!ACCEPTED.includes(file.type)) throw new Error('invalid_type')
  if (file.size > MAX_FILE_MB * 1024 * 1024) throw new Error('too_big')
  if (!supabase) {
    const { blob } = await shrink(file, 640, 0.75)
    return await new Promise<string>((res, rej) => {
      const r = new FileReader()
      r.onload = () => res(String(r.result))
      r.onerror = () => rej(new Error('invalid_image'))
      r.readAsDataURL(blob)
    })
  }
  const { blob, type } = await shrink(file, 1200, 0.82)
  const path = `${await getEstablishmentId()}/${crypto.randomUUID()}.${type === 'image/webp' ? 'webp' : 'jpg'}`
  const { error } = await supabase.storage.from(PHOTO_BUCKET).upload(path, blob, { contentType: type, cacheControl: '31536000' })
  if (error) throw error
  return supabase.storage.from(PHOTO_BUCKET).getPublicUrl(path).data.publicUrl
}
