-- Corrige a recursão entre as políticas RLS de activities e classroom_activities.
-- Execute no SQL Editor do Supabase se o site mostrar:
-- "infinite recursion detected in policy for relation activities".
-- Requer que supabase-migrations-20261005120000_classrooms_pix_approvals.sql já tenha concluído.
-- Reaplicável. Não execute novamente a migração core.

begin;

create or replace function public.activity_is_published_approved(p_activity uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.activities a where a.id=p_activity and a.is_published and a.approval_status='approved');
$$;

create or replace function public.activity_is_owned_by(p_activity uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.activities a where a.id=p_activity and a.created_by=(select auth.uid()));
$$;

create or replace function public.activity_has_teacher_assignment(p_activity uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.classroom_activities ca where ca.activity_id=p_activity and public.is_teacher_of_class(ca.classroom_id));
$$;

create or replace function public.teacher_can_manage_activity(p_activity uuid,p_permission text)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.classroom_activities ca where ca.activity_id=p_activity and public.teacher_class_can(ca.classroom_id,p_permission))
    and not exists(select 1 from public.classroom_activities ca where ca.activity_id=p_activity and not public.teacher_class_can(ca.classroom_id,p_permission));
$$;

drop policy if exists activities_read_creator_admin_or_assigned on public.activities;
drop policy if exists activities_teacher_insert_own on public.activities;
drop policy if exists activities_editor_update on public.activities;
drop policy if exists activities_editor_delete on public.activities;
drop policy if exists activities_read_scoped on public.activities;
create policy activities_read_scoped on public.activities for select to authenticated
  using (public.is_admin() or created_by=(select auth.uid()) or (is_published and approval_status='approved')
    or public.activity_has_teacher_assignment(id));

drop policy if exists activities_teacher_update_scoped on public.activities;
create policy activities_teacher_update_scoped on public.activities for update to authenticated
  using (created_by=(select auth.uid()) and public.teacher_can_manage_activity(id,'edit_activities'))
  with check (created_by=(select auth.uid()) and public.teacher_can_manage_activity(id,'edit_activities'));

drop policy if exists activities_teacher_delete_scoped on public.activities;
create policy activities_teacher_delete_scoped on public.activities for delete to authenticated
  using (created_by=(select auth.uid()) and public.teacher_can_manage_activity(id,'edit_activities'));

drop policy if exists classroom_activities_teacher_assign on public.classroom_activities;
drop policy if exists classroom_activities_teacher_unassign on public.classroom_activities;
drop policy if exists classroom_activities_read_member on public.classroom_activities;
create policy classroom_activities_read_member on public.classroom_activities for select to authenticated
  using (public.is_admin() or public.is_teacher_of_class(classroom_id) or (public.is_student_of_class(classroom_id)
    and public.activity_is_published_approved(activity_id)));

drop policy if exists classroom_activities_teacher_insert_scoped on public.classroom_activities;
create policy classroom_activities_teacher_insert_scoped on public.classroom_activities for insert to authenticated with check (
  assigned_by=(select auth.uid()) and public.teacher_class_can(classroom_id,'create_activities')
    and public.activity_is_owned_by(activity_id) and public.activity_is_published_approved(activity_id));

drop policy if exists classroom_activities_teacher_delete_scoped on public.classroom_activities;
create policy classroom_activities_teacher_delete_scoped on public.classroom_activities for delete to authenticated using (
  public.teacher_class_can(classroom_id,'edit_activities') and public.activity_is_owned_by(activity_id));

revoke all on function public.activity_is_published_approved(uuid) from public,anon;
revoke all on function public.activity_is_owned_by(uuid) from public,anon;
revoke all on function public.activity_has_teacher_assignment(uuid) from public,anon;
revoke all on function public.teacher_can_manage_activity(uuid,text) from public,anon;
grant execute on function public.activity_is_published_approved(uuid) to authenticated;
grant execute on function public.activity_is_owned_by(uuid) to authenticated;
grant execute on function public.activity_has_teacher_assignment(uuid) to authenticated;
grant execute on function public.teacher_can_manage_activity(uuid,text) to authenticated;

notify pgrst, 'reload schema';
commit;
