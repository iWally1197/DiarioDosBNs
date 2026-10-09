begin;

insert into public.site_settings(key, value)
values (
  'live_video',
  jsonb_build_object(
    'enabled', false,
    'title', 'Diário dos BNs ao vivo',
    'description', 'Acompanhe as transmissões e aulas ao vivo do projeto.',
    'youtube_url', ''
  )
)
on conflict (key) do nothing;

drop policy if exists site_settings_public_pix_read on public.site_settings;
create policy site_settings_public_pix_read
  on public.site_settings
  for select
  to anon, authenticated
  using (key in ('pix', 'live_video'));

commit;
