-- Repara e reaplica as regras do bucket privado de downloads sem apagar arquivos.
-- Execute como uma migration nova; não reexecute a migration core já aplicada.
begin;

insert into storage.buckets(id,name,public)
values('downloads','downloads',false)
on conflict(id) do update set public=false;

drop policy if exists "Download access follows database visibility" on storage.objects;
drop policy if exists "Administrators can inspect private download files" on storage.objects;
drop policy if exists "Administrators can add private download files" on storage.objects;
drop policy if exists "Administrators can update private download files" on storage.objects;
drop policy if exists "Administrators can delete private download files" on storage.objects;

create policy "Download access follows database visibility"
on storage.objects for select to anon,authenticated
using (bucket_id='downloads' and public.can_access_download(name));

create policy "Administrators can inspect private download files"
on storage.objects for select to authenticated
using (bucket_id='downloads' and public.is_admin());

create policy "Administrators can add private download files"
on storage.objects for insert to authenticated
with check (bucket_id='downloads' and public.is_admin());

create policy "Administrators can update private download files"
on storage.objects for update to authenticated
using (bucket_id='downloads' and public.is_admin())
with check (bucket_id='downloads' and public.is_admin());

create policy "Administrators can delete private download files"
on storage.objects for delete to authenticated
using (bucket_id='downloads' and public.is_admin());

notify pgrst, 'reload schema';
commit;
