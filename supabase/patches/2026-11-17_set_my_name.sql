-- Cada pessoa edita o próprio nome (tela "Meu perfil"). O nome mora em `profiles.full_name` (a própria pessoa edita)
-- e em `memberships.display_name` (que a gestão lê e a policy só deixa o dono mexer); a função atualiza os dois
-- só para quem está logado. Aplicado em 2026-11-17 como migração `set_my_name`.

create or replace function public.set_my_name(p_name text)
 returns void
 language plpgsql
 security definer
 set search_path to ''
as $function$
declare v_name text := nullif(btrim(coalesce(p_name, '')), '');
begin
  if (select auth.uid()) is null then raise exception 'forbidden' using errcode = '42501'; end if;
  if v_name is null or length(v_name) > 80 then raise exception 'invalid_name' using errcode = 'P0001'; end if;
  update public.profiles set full_name = v_name where id = (select auth.uid());
  update public.memberships set display_name = v_name where user_id = (select auth.uid());
end;
$function$;

revoke execute on function public.set_my_name(text) from public, anon;
grant execute on function public.set_my_name(text) to authenticated;
