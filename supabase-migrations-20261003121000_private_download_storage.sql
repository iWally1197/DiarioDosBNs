-- Antes desta migração, crie no Dashboard um bucket chamado “downloads”
-- com Public bucket desativado. Arquivos públicos do site continuam na raiz;
-- materiais exclusivos devem existir somente neste bucket privado.
begin;

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

commit;
