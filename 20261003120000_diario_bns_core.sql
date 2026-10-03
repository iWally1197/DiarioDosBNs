-- Diário dos BNs: esquema inicial. Aplicar uma única vez no Supabase SQL Editor.
-- Roles nunca vêm de um campo de perfil editável pelo navegador.
begin;

create type public.account_role as enum ('aluno','professor','admin');
create type public.account_status as enum ('active','pending','blocked');
create type public.download_visibility as enum ('public','students','teachers');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default '' check (char_length(display_name) <= 100),
  bio text not null default '' check (char_length(bio) <= 500),
  avatar_path text,
  terms_version text not null,
  privacy_version text not null,
  terms_accepted_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.user_roles (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  role public.account_role not null default 'aluno',
  status public.account_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.animations (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 1 and 160),
  topic text not null check (char_length(topic) <= 100),
  slug text not null unique check (slug ~ '^[a-z0-9-]+$'),
  summary text not null default '' check (char_length(summary) <= 3000),
  level text not null default 'Ensino médio' check (char_length(level) <= 60),
  duration_seconds integer check (duration_seconds is null or duration_seconds between 0 and 86400),
  video_url text,
  is_published boolean not null default false,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.downloads (
  id uuid primary key default gen_random_uuid(),
  animation_id uuid references public.animations(id) on delete set null,
  title text not null check (char_length(title) between 1 and 160),
  description text not null default '' check (char_length(description) <= 1000),
  file_name text not null check (char_length(file_name) <= 255),
  storage_bucket text not null default 'downloads',
  storage_path text not null,
  visibility public.download_visibility not null default 'public',
  is_published boolean not null default false,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  unique(storage_bucket, storage_path)
);

create table public.favorites (
  user_id uuid not null references auth.users(id) on delete cascade,
  animation_id uuid not null references public.animations(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key(user_id, animation_id)
);

create table public.courses (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 1 and 160),
  description text not null default '' check (char_length(description) <= 3000),
  is_published boolean not null default false,
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.lessons (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 160),
  body text not null default '',
  position integer not null default 0,
  video_url text,
  created_at timestamptz not null default now(),
  unique(course_id, position)
);

create table public.lesson_progress (
  user_id uuid not null references auth.users(id) on delete cascade,
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  progress_percent integer not null default 0 check (progress_percent between 0 and 100),
  completed_at timestamptz,
  updated_at timestamptz not null default now(),
  primary key(user_id, lesson_id)
);

create table public.classrooms (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 100),
  description text not null default '' check (char_length(description) <= 1000),
  join_code text not null unique default upper(substr(replace(gen_random_uuid()::text,'-',''),1,8)),
  is_open boolean not null default true,
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table public.teacher_classrooms (
  classroom_id uuid not null references public.classrooms(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key(classroom_id,user_id)
);

create table public.student_classrooms (
  classroom_id uuid not null references public.classrooms(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key(classroom_id,user_id)
);

create table public.activities (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 1 and 160),
  subject text not null default '' check (char_length(subject) <= 100),
  description text not null default '' check (char_length(description) <= 5000),
  animation_id uuid references public.animations(id) on delete set null,
  is_published boolean not null default false,
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.classroom_activities (
  classroom_id uuid not null references public.classrooms(id) on delete cascade,
  activity_id uuid not null references public.activities(id) on delete cascade,
  assigned_by uuid not null references auth.users(id) on delete cascade,
  due_at timestamptz,
  created_at timestamptz not null default now(),
  primary key(classroom_id,activity_id)
);

create table public.activity_submissions (
  id uuid primary key default gen_random_uuid(),
  activity_id uuid not null,
  classroom_id uuid not null,
  student_id uuid not null references public.profiles(id) on delete cascade,
  response text not null check (char_length(response) <= 5000),
  submitted_at timestamptz not null default now(),
  unique(activity_id,classroom_id,student_id),
  foreign key(classroom_id,activity_id) references public.classroom_activities(classroom_id,activity_id) on delete cascade
);

create table public.submission_feedback (
  submission_id uuid primary key references public.activity_submissions(id) on delete cascade,
  teacher_id uuid not null references auth.users(id) on delete cascade,
  feedback text not null check (char_length(feedback) <= 1000),
  updated_at timestamptz not null default now()
);

create index animations_published_topic_idx on public.animations(is_published,topic);
create index downloads_visibility_published_idx on public.downloads(visibility,is_published);
create index teacher_classrooms_user_idx on public.teacher_classrooms(user_id,classroom_id);
create index student_classrooms_user_idx on public.student_classrooms(user_id,classroom_id);
create index classroom_activities_activity_idx on public.classroom_activities(activity_id,classroom_id);
create index activity_submissions_student_idx on public.activity_submissions(student_id,submitted_at desc);
create index courses_published_idx on public.courses(is_published);

create or replace function public.has_active_role(p_role public.account_role)
returns boolean language sql stable security definer set search_path = '' as $$
  select auth.uid() is not null and exists (
    select 1 from public.user_roles r where r.user_id=(select auth.uid()) and r.role=p_role and r.status='active'
  );
$$;

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = '' as $$
  select public.has_active_role('admin'::public.account_role);
$$;

create or replace function public.is_teacher_of_class(p_classroom uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select public.has_active_role('professor'::public.account_role) and exists (
    select 1 from public.teacher_classrooms t where t.classroom_id=p_classroom and t.user_id=(select auth.uid())
  );
$$;

create or replace function public.is_student_of_class(p_classroom uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select public.has_active_role('aluno'::public.account_role) and exists (
    select 1 from public.student_classrooms s where s.classroom_id=p_classroom and s.user_id=(select auth.uid())
  );
$$;

create or replace function public.is_teacher_for_student(p_student uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select public.has_active_role('professor'::public.account_role) and exists (
    select 1 from public.teacher_classrooms t join public.student_classrooms s using(classroom_id)
    where t.user_id=(select auth.uid()) and s.user_id=p_student
  );
$$;

create or replace function public.student_has_activity(p_activity uuid,p_classroom uuid)
returns boolean language sql stable security definer set search_path = '' as $
  select auth.uid() is not null and exists (
    select 1 from public.classroom_activities ca join public.student_classrooms sc using(classroom_id)
    where ca.activity_id=p_activity and ca.classroom_id=p_classroom and sc.user_id=(select auth.uid())
  );
$;

create or replace function public.can_access_download(p_path text)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.downloads d
    where d.storage_bucket='downloads' and d.storage_path=p_path and d.is_published
      and (d.visibility='public'
        or (d.visibility='students' and (public.has_active_role('aluno'::public.account_role) or public.has_active_role('professor'::public.account_role) or public.is_admin()))
        or (d.visibility='teachers' and (public.has_active_role('professor'::public.account_role) or public.is_admin())))
  );
$$;

create or replace function public.create_classroom(p_name text,p_description text default '')
returns table(id uuid,name text,join_code text)
language plpgsql security definer set search_path = '' as $$
declare v_id uuid;
begin
  if not public.has_active_role('professor'::public.account_role) then raise exception 'Aprovação docente necessária.'; end if;
  insert into public.classrooms(name,description,created_by) values (left(trim(p_name),100),left(coalesce(p_description,''),1000),(select auth.uid())) returning classrooms.id into v_id;
  insert into public.teacher_classrooms(classroom_id,user_id) values(v_id,(select auth.uid()));
  return query select c.id,c.name,c.join_code from public.classrooms c where c.id=v_id;
end;
$$;

create or replace function public.join_class_by_code(p_code text)
returns uuid language plpgsql security definer set search_path = '' as $$
declare v_id uuid;
begin
  if not public.has_active_role('aluno'::public.account_role) then raise exception 'Somente alunos ativos podem entrar em uma turma.'; end if;
  select c.id into v_id from public.classrooms c where c.join_code=upper(trim(p_code)) and c.is_open limit 1;
  if v_id is null then raise exception 'Código inválido ou turma fechada.'; end if;
  insert into public.student_classrooms(classroom_id,user_id) values(v_id,(select auth.uid())) on conflict do nothing;
  return v_id;
end;
$$;

create or replace function public.handle_auth_user_created()
returns trigger language plpgsql security definer set search_path = '' as $$
declare v_requested text; v_role public.account_role; v_status public.account_status;
begin
  if new.raw_user_meta_data->>'terms_version' is distinct from '1.0'
     or new.raw_user_meta_data->>'privacy_version' is distinct from '1.0' then
    raise exception 'Aceite vigente dos termos e da política é obrigatório.';
  end if;
  v_requested := new.raw_user_meta_data->>'requested_role';
  if v_requested='professor' then v_role:='professor'; v_status:='pending';
  else v_role:='aluno'; v_status:='active'; end if;
  insert into public.profiles(id,display_name,terms_version,privacy_version)
    values(new.id,left(coalesce(new.raw_user_meta_data->>'display_name',''),100),'1.0','1.0');
  insert into public.user_roles(user_id,role,status) values(new.id,v_role,v_status);
  return new;
end;
$$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute procedure public.handle_auth_user_created();

create or replace function public.touch_updated_at()
returns trigger language plpgsql set search_path = '' as $$ begin new.updated_at=now(); return new; end; $$;
create trigger profiles_touch before update on public.profiles for each row execute procedure public.touch_updated_at();
create trigger roles_touch before update on public.user_roles for each row execute procedure public.touch_updated_at();
create trigger animations_touch before update on public.animations for each row execute procedure public.touch_updated_at();
create trigger courses_touch before update on public.courses for each row execute procedure public.touch_updated_at();
create trigger activities_touch before update on public.activities for each row execute procedure public.touch_updated_at();

alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;
alter table public.animations enable row level security;
alter table public.downloads enable row level security;
alter table public.favorites enable row level security;
alter table public.courses enable row level security;
alter table public.lessons enable row level security;
alter table public.lesson_progress enable row level security;
alter table public.classrooms enable row level security;
alter table public.teacher_classrooms enable row level security;
alter table public.student_classrooms enable row level security;
alter table public.activities enable row level security;
alter table public.classroom_activities enable row level security;
alter table public.activity_submissions enable row level security;
alter table public.submission_feedback enable row level security;

-- Profiles: authentication e e-mail ficam em auth.users; o perfil não contém credenciais.
create policy profile_read_self_teacher_admin on public.profiles for select to authenticated
  using (id=(select auth.uid()) or public.is_admin() or public.is_teacher_for_student(id));
create policy profile_update_self on public.profiles for update to authenticated
  using (id=(select auth.uid())) with check (id=(select auth.uid()));

-- O usuário pode consultar sua role, mas não inserir, trocar role nem aprovar a si mesmo.
create policy user_roles_read_self_or_admin on public.user_roles for select to authenticated
  using (user_id=(select auth.uid()) or public.is_admin());
create policy user_roles_admin_update_status on public.user_roles for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy animations_read_published_or_owner on public.animations for select to anon,authenticated
  using (is_published or created_by=(select auth.uid()) or public.is_admin());
create policy animations_teacher_insert_own on public.animations for insert to authenticated
  with check (created_by=(select auth.uid()) and (public.has_active_role('professor'::public.account_role) or public.is_admin()));
create policy animations_editor_update on public.animations for update to authenticated
  using (public.is_admin() or (created_by=(select auth.uid()) and public.has_active_role('professor'::public.account_role)))
  with check (public.is_admin() or (created_by=(select auth.uid()) and public.has_active_role('professor'::public.account_role)));
create policy animations_editor_delete on public.animations for delete to authenticated
  using (public.is_admin() or (created_by=(select auth.uid()) and public.has_active_role('professor'::public.account_role)));

create policy downloads_read_by_visibility on public.downloads for select to anon,authenticated
  using (public.is_admin() or (created_by=(select auth.uid())) or (is_published and (visibility='public'
    or (visibility='students' and (public.has_active_role('aluno'::public.account_role) or public.has_active_role('professor'::public.account_role) or public.is_admin()))
    or (visibility='teachers' and (public.has_active_role('professor'::public.account_role) or public.is_admin())))));
create policy downloads_admin_insert on public.downloads for insert to authenticated with check (public.is_admin() and created_by=(select auth.uid()));
create policy downloads_admin_update on public.downloads for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy downloads_admin_delete on public.downloads for delete to authenticated using (public.is_admin());

create policy favorites_read_own on public.favorites for select to authenticated using (user_id=(select auth.uid()));
create policy favorites_insert_own on public.favorites for insert to authenticated
  with check (user_id=(select auth.uid()) and (public.has_active_role('aluno'::public.account_role) or public.has_active_role('professor'::public.account_role)));
create policy favorites_delete_own on public.favorites for delete to authenticated using (user_id=(select auth.uid()));

create policy courses_read_published_or_owner on public.courses for select to anon,authenticated
  using (is_published or created_by=(select auth.uid()) or public.is_admin());
create policy courses_teacher_insert_own on public.courses for insert to authenticated
  with check (created_by=(select auth.uid()) and is_published=false and public.has_active_role('professor'::public.account_role));
create policy courses_owner_update on public.courses for update to authenticated
  using (public.is_admin() or (created_by=(select auth.uid()) and public.has_active_role('professor'::public.account_role)))
  with check (public.is_admin() or (created_by=(select auth.uid()) and is_published=false and public.has_active_role('professor'::public.account_role)));
create policy courses_owner_delete on public.courses for delete to authenticated
  using (public.is_admin() or (created_by=(select auth.uid()) and public.has_active_role('professor'::public.account_role)));

create policy lessons_read_published_or_owner on public.lessons for select to anon,authenticated
  using (exists(select 1 from public.courses c where c.id=course_id and (c.is_published or c.created_by=(select auth.uid()) or public.is_admin())));
create policy lessons_teacher_insert_own on public.lessons for insert to authenticated
  with check (exists(select 1 from public.courses c where c.id=course_id and c.created_by=(select auth.uid()) and public.has_active_role('professor'::public.account_role)) or public.is_admin());
create policy lessons_editor_update on public.lessons for update to authenticated
  using (public.is_admin() or exists(select 1 from public.courses c where c.id=course_id and c.created_by=(select auth.uid()) and public.has_active_role('professor'::public.account_role)))
  with check (public.is_admin() or exists(select 1 from public.courses c where c.id=course_id and c.created_by=(select auth.uid()) and public.has_active_role('professor'::public.account_role)));
create policy lessons_editor_delete on public.lessons for delete to authenticated
  using (public.is_admin() or exists(select 1 from public.courses c where c.id=course_id and c.created_by=(select auth.uid()) and public.has_active_role('professor'::public.account_role)));

create policy lesson_progress_read_own_or_admin on public.lesson_progress for select to authenticated
  using (user_id=(select auth.uid()) or public.is_admin());
create policy lesson_progress_insert_own on public.lesson_progress for insert to authenticated
  with check (user_id=(select auth.uid()) and (public.has_active_role('aluno'::public.account_role) or public.has_active_role('professor'::public.account_role)));
create policy lesson_progress_update_own on public.lesson_progress for update to authenticated
  using (user_id=(select auth.uid())) with check (user_id=(select auth.uid()));
create policy lesson_progress_delete_own on public.lesson_progress for delete to authenticated using (user_id=(select auth.uid()));

create policy classrooms_read_member_or_admin on public.classrooms for select to authenticated
  using (public.is_admin() or public.is_teacher_of_class(id) or public.is_student_of_class(id));
create policy classrooms_insert_teacher on public.classrooms for insert to authenticated
  with check (created_by=(select auth.uid()) and (public.has_active_role('professor'::public.account_role) or public.is_admin()));
create policy classrooms_update_teacher_admin on public.classrooms for update to authenticated
  using (public.is_admin() or public.is_teacher_of_class(id)) with check (public.is_admin() or public.is_teacher_of_class(id));
create policy classrooms_delete_teacher_admin on public.classrooms for delete to authenticated
  using (public.is_admin() or public.is_teacher_of_class(id));

create policy teacher_classrooms_read_related on public.teacher_classrooms for select to authenticated
  using (user_id=(select auth.uid()) or public.is_teacher_of_class(classroom_id) or public.is_admin());
create policy teacher_classrooms_insert_owner_or_admin on public.teacher_classrooms for insert to authenticated
  with check (public.is_admin() or (user_id=(select auth.uid()) and public.has_active_role('professor'::public.account_role)
    and exists(select 1 from public.classrooms c where c.id=classroom_id and c.created_by=(select auth.uid()))));
create policy teacher_classrooms_delete_owner_admin on public.teacher_classrooms for delete to authenticated
  using (public.is_admin() or public.is_teacher_of_class(classroom_id));

create policy student_classrooms_read_related on public.student_classrooms for select to authenticated
  using (user_id=(select auth.uid()) or public.is_teacher_of_class(classroom_id) or public.is_admin());
create policy student_classrooms_teacher_enroll on public.student_classrooms for insert to authenticated
  with check (public.is_admin() or (public.is_teacher_of_class(classroom_id)
    and exists(select 1 from public.user_roles r where r.user_id=user_id and r.role='aluno' and r.status='active')));
create policy student_classrooms_leave_or_remove on public.student_classrooms for delete to authenticated
  using (user_id=(select auth.uid()) or public.is_admin() or public.is_teacher_of_class(classroom_id));

create policy activities_read_creator_admin_or_assigned on public.activities for select to authenticated
  using (created_by=(select auth.uid()) or public.is_admin() or exists(
    select 1 from public.classroom_activities ca where ca.activity_id=id and public.is_student_of_class(ca.classroom_id)));
create policy activities_teacher_insert_own on public.activities for insert to authenticated
  with check (created_by=(select auth.uid()) and (public.has_active_role('professor'::public.account_role) or public.is_admin()));
create policy activities_editor_update on public.activities for update to authenticated
  using (public.is_admin() or (created_by=(select auth.uid()) and public.has_active_role('professor'::public.account_role)))
  with check (public.is_admin() or (created_by=(select auth.uid()) and public.has_active_role('professor'::public.account_role)));
create policy activities_editor_delete on public.activities for delete to authenticated
  using (public.is_admin() or (created_by=(select auth.uid()) and public.has_active_role('professor'::public.account_role)));

create policy classroom_activities_read_member on public.classroom_activities for select to authenticated
  using (public.is_admin() or public.is_teacher_of_class(classroom_id) or public.is_student_of_class(classroom_id));
create policy classroom_activities_teacher_assign on public.classroom_activities for insert to authenticated
  with check (public.is_admin() or (assigned_by=(select auth.uid()) and public.is_teacher_of_class(classroom_id)
    and exists(select 1 from public.activities a where a.id=activity_id and a.created_by=(select auth.uid()))));
create policy classroom_activities_teacher_unassign on public.classroom_activities for delete to authenticated
  using (public.is_admin() or public.is_teacher_of_class(classroom_id));

create policy submissions_read_student_teacher_admin on public.activity_submissions for select to authenticated
  using (student_id=(select auth.uid()) or public.is_admin() or (public.is_teacher_of_class(classroom_id)
    and exists(select 1 from public.classroom_activities ca where ca.classroom_id=activity_submissions.classroom_id and ca.activity_id=activity_submissions.activity_id)));
create policy submissions_insert_assigned_student on public.activity_submissions for insert to authenticated
  with check (student_id=(select auth.uid()) and public.has_active_role('aluno'::public.account_role)
    and public.student_has_activity(activity_id,classroom_id));
create policy submissions_update_own_assigned on public.activity_submissions for update to authenticated
  using (student_id=(select auth.uid()) and public.student_has_activity(activity_id,classroom_id))
  with check (student_id=(select auth.uid()) and public.student_has_activity(activity_id,classroom_id));
create policy submissions_delete_own_or_admin on public.activity_submissions for delete to authenticated
  using (student_id=(select auth.uid()) or public.is_admin());

create policy feedback_read_student_teacher_admin on public.submission_feedback for select to authenticated
  using (public.is_admin() or teacher_id=(select auth.uid()) or exists(
    select 1 from public.activity_submissions s where s.id=submission_id and s.student_id=(select auth.uid())));
create policy feedback_teacher_insert on public.submission_feedback for insert to authenticated
  with check (teacher_id=(select auth.uid()) and exists(
    select 1 from public.activity_submissions s where s.id=submission_id and public.is_teacher_of_class(s.classroom_id)));
create policy feedback_teacher_update on public.submission_feedback for update to authenticated
  using (public.is_admin() or (teacher_id=(select auth.uid()) and exists(
    select 1 from public.activity_submissions s where s.id=submission_id and public.is_teacher_of_class(s.classroom_id))))
  with check (public.is_admin() or (teacher_id=(select auth.uid()) and exists(
    select 1 from public.activity_submissions s where s.id=submission_id and public.is_teacher_of_class(s.classroom_id))));

-- Downloads armazenados no bucket privado “downloads” só podem ser assinados se
-- a linha de metadados permitir aquele perfil. O bucket deve ser criado como privado.
grant execute on function public.has_active_role(public.account_role) to anon,authenticated;
grant execute on function public.is_admin() to anon,authenticated;
grant execute on function public.is_teacher_of_class(uuid) to authenticated;
grant execute on function public.is_student_of_class(uuid) to authenticated;
grant execute on function public.is_teacher_for_student(uuid) to authenticated;
grant execute on function public.student_has_activity(uuid,uuid) to authenticated;
grant execute on function public.can_access_download(text) to anon,authenticated;
grant execute on function public.create_classroom(text,text) to authenticated;
grant execute on function public.join_class_by_code(text) to authenticated;
revoke all on function public.handle_auth_user_created() from public,anon,authenticated;

revoke all on public.profiles,public.user_roles,public.animations,public.downloads,public.favorites,
  public.courses,public.lessons,public.lesson_progress,public.classrooms,public.teacher_classrooms,
  public.student_classrooms,public.activities,public.classroom_activities,public.activity_submissions,
  public.submission_feedback from anon,authenticated;

grant select on public.animations,public.courses,public.lessons,public.downloads to anon,authenticated;
grant select(id,display_name,bio,avatar_path,created_at),update(display_name,bio,avatar_path) on public.profiles to authenticated;
grant select,update(status) on public.user_roles to authenticated;
grant insert,select,delete on public.favorites to authenticated;
grant select,insert,update,delete on public.courses,public.lessons,public.lesson_progress,public.classrooms,
  public.teacher_classrooms,public.student_classrooms,public.activities,public.classroom_activities,
  public.activity_submissions,public.submission_feedback to authenticated;
grant insert,update,delete on public.animations,public.downloads to authenticated;

-- IDs não fazem papel de senha: todos os acessos acima continuam sujeitos a RLS.
commit;
