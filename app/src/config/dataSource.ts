/**
 * De onde vêm os dados. Padrão: serviços simulados (src/mocks). `VITE_DATA_SOURCE=supabase` liga o banco real, quando o endereço
 * e a chave pública estão configurados (veja `.env.example`). Fica separado para o app carregar o Supabase só quando precisa.
 */
export const useSupabase: boolean =
  import.meta.env.VITE_DATA_SOURCE === 'supabase' && Boolean(import.meta.env.VITE_SUPABASE_URL) && Boolean(import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY)
