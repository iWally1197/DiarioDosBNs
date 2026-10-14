begin;

drop policy if exists physics_questions_admin_manage on public.physics_questions;
drop policy if exists physics_questions_admin_insert on public.physics_questions;
drop policy if exists physics_questions_admin_update on public.physics_questions;
drop policy if exists physics_questions_admin_delete on public.physics_questions;

create policy physics_questions_admin_insert
  on public.physics_questions for insert to authenticated
  with check (public.is_admin());

create policy physics_questions_admin_update
  on public.physics_questions for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy physics_questions_admin_delete
  on public.physics_questions for delete to authenticated
  using (public.is_admin());

create index if not exists physics_questions_created_by_idx
  on public.physics_questions (created_by);

commit;

