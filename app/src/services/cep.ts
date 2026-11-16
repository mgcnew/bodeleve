// Consulta de CEP (ViaCEP, público e gratuito). Falha em silêncio: a pessoa digita rua e bairro.

export async function lookupCep(cep: string): Promise<{ street: string; district: string } | null> {
  try {
    const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`)
    if (!res.ok) return null
    const data = (await res.json()) as { erro?: boolean; logradouro?: string; bairro?: string }
    if (data.erro) return null
    return { street: data.logradouro ?? '', district: data.bairro ?? '' }
  } catch {
    return null
  }
}
