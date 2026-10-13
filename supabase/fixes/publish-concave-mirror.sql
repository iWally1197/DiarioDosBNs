-- One-time repair: ensure the concave-mirror lab exists and is published.
-- Run this file once in the Supabase SQL Editor as the postgres role.
-- Afterward, normal publication changes remain controlled by the admin panel.

begin;

-- The app trigger intentionally blocks non-admin API changes to publication.
-- Temporarily disable only that guard for this direct SQL repair; rollback restores it if anything fails.
do $$
begin
  if exists (
    select 1
    from pg_trigger
    where tgrelid = 'public.animations'::regclass
      and tgname = 'animations_admin_publication_only'
      and not tgisinternal
  ) then
    execute 'alter table public.animations disable trigger animations_admin_publication_only';
  end if;
end
$$;

insert into public.animations (title, topic, slug, summary, level, is_published)
values (
  'Espelho côncavo',
  'Laboratório de Física',
  'lab-espelho-concavo',
  'Investigue o foco, os raios refletidos e a formação de imagens reais e virtuais.',
  'Ensino médio',
  true
)
on conflict (slug) do update
set is_published = excluded.is_published;

do $$
begin
  if exists (
    select 1
    from pg_trigger
    where tgrelid = 'public.animations'::regclass
      and tgname = 'animations_admin_publication_only'
      and not tgisinternal
  ) then
    execute 'alter table public.animations enable trigger animations_admin_publication_only';
  end if;
end
$$;

commit;

select slug, title, is_published
from public.animations
where slug = 'lab-espelho-concavo';
