begin;

-- A RLS atual permite que professores ativos editem seus próprios registros.
-- Este trigger preserva essa edição, mas reserva a mudança de publicação a administradores ativos.
create or replace function public.enforce_admin_animation_publication()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $function$
begin
  if new.is_published is distinct from old.is_published
     and not public.is_admin() then
    raise exception 'Somente administradores ativos podem alterar a publicação.'
      using errcode = '42501';
  end if;
  return new;
end;
$function$;

revoke all on function public.enforce_admin_animation_publication() from public, anon, authenticated;
drop trigger if exists animations_admin_publication_only on public.animations;
create trigger animations_admin_publication_only
before update of is_published on public.animations
for each row execute function public.enforce_admin_animation_publication();

commit;
