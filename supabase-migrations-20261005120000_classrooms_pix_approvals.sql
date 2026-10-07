-- Diário dos BNs: turmas, permissões, revisão docente, notificações e PIX.
-- Execute depois das migrações core e educação/perfis no Supabase SQL Editor.
-- Idempotente para facilitar reexecução após erro parcial.

begin;

create or replace function public.generate_class_join_code()
returns text language sql volatile set search_path = '' as $$
  select 'DBN-' || upper(substr(replace(gen_random_uuid()::text,'-',''),1,5));
$$;

alter table public.classrooms
  add column if not exists discipline text not null default '' check (char_length(discipline) <= 100),
  add column if not exists grade_level text not null default '' check (char_length(grade_level) <= 100),
  add column if not exists starts_on date,
  add column if not exists ends_on date,
  add column if not exists status text not null default 'active' check (status in ('active','closed','completed')),
  add column if not exists join_code_enabled boolean not null default true;

alter table public.classrooms alter column join_code set default public.generate_class_join_code();
update public.classrooms set join_code=public.generate_class_join_code()
where join_code !~ '^DBN-[A-Z0-9]{5}$';

create table if not exists public.class_permissions (
  classroom_id uuid primary key references public.classrooms(id) on delete cascade,
  can_create_activities boolean not null default false,
  can_edit_activities boolean not null default false,
  can_publish_activities boolean not null default false,
  require_activity_approval boolean not null default true,
  can_create_lessons boolean not null default false,
  can_edit_lessons boolean not null default false,
  can_send_materials boolean not null default false,
  can_view_progress boolean not null default false,
  updated_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now()
);

insert into public.class_permissions(classroom_id)
select id from public.classrooms on conflict do nothing;

create or replace function public.seed_class_permissions()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.class_permissions(classroom_id) values(new.id) on conflict do nothing;
  return new;
end;
$$;
drop trigger if exists classrooms_seed_permissions on public.classrooms;
create trigger classrooms_seed_permissions after insert on public.classrooms
for each row execute function public.seed_class_permissions();

alter table public.activities
  add column if not exists approval_status text not null default 'approved'
    check (approval_status in ('draft','pending','approved','changes_requested','rejected')),
  add column if not exists review_note text not null default '' check (char_length(review_note) <= 2000),
  add column if not exists reviewed_by uuid references auth.users(id) on delete set null,
  add column if not exists reviewed_at timestamptz,
  add column if not exists points numeric(7,2) not null default 0 check (points >= 0 and points <= 100000),
  add column if not exists requires_response boolean not null default true,
  add column if not exists published_at timestamptz;

create table if not exists public.teacher_verifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending','verified','rejected','review')),
  requested_at timestamptz not null default now(),
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  admin_note text not null default '' check (char_length(admin_note) <= 2000),
  created_at timestamptz not null default now()
);
alter table public.teacher_verifications drop constraint if exists teacher_verifications_status_check;
alter table public.teacher_verifications add constraint teacher_verifications_status_check
  check (status in ('pending','verified','rejected','review','blocked'));

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid not null references auth.users(id) on delete cascade,
  kind text not null check (char_length(kind) between 1 and 60),
  title text not null check (char_length(title) between 1 and 160),
  body text not null default '' check (char_length(body) <= 1000),
  href text not null default '',
  created_at timestamptz not null default now(),
  read_at timestamptz
);
alter table public.notifications add column if not exists dedupe_key text;
update public.notifications set href=substring(href from 2) where href in ('/admin/','/professor/') or href like '/turma.html%';
create index if not exists notifications_recipient_created_idx
  on public.notifications(recipient_id, created_at desc);
create unique index if not exists notifications_recipient_dedupe_idx
  on public.notifications(recipient_id,dedupe_key) where dedupe_key is not null;

create or replace function public.notify_student_upcoming_deadlines()
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not public.has_active_role('aluno'::public.account_role) then return; end if;
  insert into public.notifications(recipient_id,kind,title,body,href,dedupe_key)
  select sc.user_id,'due_soon','Prazo próximo: '||a.title,
    'A atividade vence em até 48 horas. Confira as instruções na página da turma.',
    'turma.html?id='||c.id::text,'due:'||a.id::text||':'||extract(epoch from ca.due_at)::bigint::text
  from public.student_classrooms sc join public.classrooms c on c.id=sc.classroom_id
  join public.classroom_activities ca on ca.classroom_id=c.id
  join public.activities a on a.id=ca.activity_id
  where sc.user_id=(select auth.uid()) and c.status='active' and a.is_published and a.approval_status='approved'
    and ca.due_at>now() and ca.due_at<=now()+interval '48 hours'
  on conflict(recipient_id,dedupe_key) where dedupe_key is not null do nothing;
end;
$$;

create table if not exists public.class_announcements (
  id uuid primary key default gen_random_uuid(),
  classroom_id uuid not null references public.classrooms(id) on delete cascade,
  created_by uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 160),
  body text not null check (char_length(body) between 1 and 5000),
  created_at timestamptz not null default now()
);

create table if not exists public.class_resources (
  id uuid primary key default gen_random_uuid(),
  classroom_id uuid not null references public.classrooms(id) on delete cascade,
  created_by uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 160),
  description text not null default '' check (char_length(description) <= 1000),
  resource_url text not null check (char_length(resource_url) between 8 and 2000 and resource_url ~* '^https://'),
  created_at timestamptz not null default now()
);

create table if not exists public.class_lessons (
  id uuid primary key default gen_random_uuid(),
  classroom_id uuid not null references public.classrooms(id) on delete cascade,
  created_by uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 160),
  body text not null default '' check (char_length(body) <= 8000),
  position integer not null default 0 check (position >= 0),
  is_published boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.activity_questions (
  id uuid primary key default gen_random_uuid(),
  activity_id uuid not null references public.activities(id) on delete cascade,
  position integer not null default 0 check (position >= 0),
  prompt text not null check (char_length(prompt) between 1 and 3000),
  created_at timestamptz not null default now(),
  unique(activity_id,position)
);

create table if not exists public.activity_resources (
  id uuid primary key default gen_random_uuid(),
  activity_id uuid not null references public.activities(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 160),
  resource_url text,
  storage_bucket text not null default 'class-materials',
  storage_path text,
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint activity_resources_location_check check (
    (resource_url is not null and char_length(resource_url) between 8 and 2000 and resource_url ~* '^https://')
    or (storage_path is not null and storage_bucket='class-materials' and char_length(storage_path) between 70 and 1024)
  )
);
alter table public.activity_resources alter column resource_url drop not null;
alter table public.activity_resources add column if not exists storage_bucket text not null default 'class-materials';
alter table public.activity_resources add column if not exists storage_path text;
alter table public.activity_resources drop constraint if exists activity_resources_resource_url_check;
alter table public.activity_resources drop constraint if exists activity_resources_location_check;
alter table public.activity_resources add constraint activity_resources_location_check check (
  (resource_url is not null and char_length(resource_url) between 8 and 2000 and resource_url ~* '^https://')
  or (storage_path is not null and storage_bucket='class-materials' and char_length(storage_path) between 70 and 1024)
);
alter table public.classroom_activities
  add column if not exists related_lesson_id uuid references public.class_lessons(id) on delete set null;

insert into storage.buckets(id,name,public,file_size_limit)
values('class-materials','class-materials',false,52428800)
on conflict(id) do update set public=false,file_size_limit=excluded.file_size_limit;

create table if not exists public.site_settings (
  key text primary key check (key ~ '^[a-z][a-z0-9_-]{0,39}$'),
  value jsonb not null default '{}'::jsonb,
  updated_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now()
);
insert into public.site_settings(key,value) values
  ('pix', jsonb_build_object('pix_key','','qr_image_url','','instructions','A chave PIX será informada pelo responsável pelo site.'))
on conflict(key) do nothing;

-- A confirmação de professor aceita no formulário passa a ser validada no banco.
create or replace function public.handle_auth_user_created()
returns trigger language plpgsql security definer set search_path = '' as $$
declare v_requested text; v_role public.account_role; v_status public.account_status;
begin
  if new.raw_user_meta_data->>'terms_version' is distinct from '1.0'
     or new.raw_user_meta_data->>'privacy_version' is distinct from '1.0' then
    raise exception 'Aceite vigente dos termos e da política é obrigatório.';
  end if;
  v_requested := new.raw_user_meta_data->>'requested_role';
  if v_requested='professor' then
    if new.raw_user_meta_data->>'teacher_verification_ack' is distinct from 'true' then
      raise exception 'Confirme a ciência da verificação docente para continuar.';
    end if;
    v_role:='professor'; v_status:='pending';
  else v_role:='aluno'; v_status:='active'; end if;
  insert into public.profiles(id,display_name,terms_version,privacy_version)
    values(new.id,left(coalesce(new.raw_user_meta_data->>'display_name',''),100),'1.0','1.0');
  insert into public.user_roles(user_id,role,status) values(new.id,v_role,v_status);
  return new;
end;
$$;

create or replace function public.seed_teacher_verification()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.role='professor' then
    insert into public.teacher_verifications(user_id,status) values(new.user_id,'pending')
    on conflict(user_id) do update set status='pending',requested_at=now(),reviewed_by=null,reviewed_at=null,admin_note='';
    insert into public.notifications(recipient_id,kind,title,body,href)
      select r.user_id,'teacher_verification','Novo professor aguardando análise','Há uma solicitação de verificação docente pendente.','admin.html'
      from public.user_roles r where r.role='admin' and r.status='active';
  end if;
  return new;
end;
$$;
drop trigger if exists user_roles_seed_teacher_verification on public.user_roles;
create trigger user_roles_seed_teacher_verification after insert on public.user_roles
for each row execute function public.seed_teacher_verification();
insert into public.teacher_verifications(user_id,status)
select user_id,case when status='active' then 'verified' else 'pending' end
from public.user_roles where role='professor'
on conflict(user_id) do nothing;

create or replace function public.is_teacher_of_class(p_classroom uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select public.has_active_role('professor'::public.account_role) and exists (
    select 1 from public.teacher_classrooms t join public.teacher_verifications v on v.user_id=t.user_id
    join public.classrooms c on c.id=t.classroom_id
    where t.classroom_id=p_classroom and t.user_id=(select auth.uid()) and v.status='verified'
  );
$$;

create or replace function public.is_teacher_for_student(p_student uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.teacher_classrooms t join public.student_classrooms s using(classroom_id)
    join public.teacher_verifications v on v.user_id=t.user_id
    join public.class_permissions p using(classroom_id)
    where t.user_id=(select auth.uid()) and s.user_id=p_student and v.status='verified' and p.can_view_progress
  );
$$;

create or replace function public.is_verified_teacher_of_class(p_classroom uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select public.is_teacher_of_class(p_classroom)
    and exists(select 1 from public.teacher_verifications v where v.user_id=(select auth.uid()) and v.status='verified')
    and exists(select 1 from public.classrooms c where c.id=p_classroom and c.status='active');
$$;

create or replace function public.join_class_by_code(p_code text)
returns uuid language plpgsql security definer set search_path = '' as $$
declare v_id uuid; v_class public.classrooms%rowtype;
begin
  if not public.has_active_role('aluno'::public.account_role) then
    raise exception 'Somente alunos ativos podem entrar em uma turma.';
  end if;
  select c.* into v_class from public.classrooms c
    where upper(trim(c.join_code))=upper(trim(p_code)) limit 1;
  if v_class.id is null then raise exception 'Código de turma inválido.'; end if;
  if not v_class.is_open or not v_class.join_code_enabled or v_class.status<>'active'
     or (v_class.starts_on is not null and v_class.starts_on>current_date)
     or (v_class.ends_on is not null and v_class.ends_on<current_date) then
    raise exception 'Esta turma não está mais aceitando novos alunos.';
  end if;
  insert into public.student_classrooms(classroom_id,user_id) values(v_class.id,(select auth.uid())) on conflict do nothing;
  return v_class.id;
end;
$$;

create or replace function public.student_has_activity(p_activity uuid,p_classroom uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select public.has_active_role('aluno'::public.account_role) and exists (
    select 1 from public.classroom_activities ca join public.student_classrooms sc using(classroom_id)
      join public.classrooms c on c.id=ca.classroom_id
    where ca.activity_id=p_activity and ca.classroom_id=p_classroom and sc.user_id=(select auth.uid())
      and c.status='active' and (c.starts_on is null or c.starts_on<=current_date)
      and (c.ends_on is null or c.ends_on>=current_date) and (ca.due_at is null or ca.due_at>=now())
  );
$$;

create or replace function public.create_classroom(p_name text,p_description text default '')
returns table(id uuid,name text,join_code text)
language plpgsql security definer set search_path = '' as $$
declare v_id uuid;
begin
  if not public.is_admin() then raise exception 'Somente o administrador pode criar turmas.'; end if;
  insert into public.classrooms(name,description,created_by)
    values(left(trim(p_name),100),left(coalesce(p_description,''),1000),(select auth.uid())) returning classrooms.id into v_id;
  return query select c.id,c.name,c.join_code from public.classrooms c where c.id=v_id;
end;
$$;

-- Retira a função antiga de criação por professor: o proprietário do sistema agora cria as turmas.
drop function if exists public.create_classroom(text,text,text);

create or replace function public.admin_regenerate_class_code(p_classroom uuid)
returns text language plpgsql security definer set search_path = '' as $$
declare v_code text;
begin
  if not public.is_admin() then raise exception 'Apenas o administrador pode alterar o código.'; end if;
  loop
    v_code:=public.generate_class_join_code();
    exit when not exists(select 1 from public.classrooms c where c.join_code=v_code);
  end loop;
  update public.classrooms set join_code=v_code where id=p_classroom;
  if not found then raise exception 'Turma não encontrada.'; end if;
  return v_code;
end;
$$;

create or replace function public.admin_review_teacher(p_user_id uuid,p_status text,p_note text default '')
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_admin() then raise exception 'Apenas o administrador pode revisar professores.'; end if;
  if p_status not in ('verified','rejected','review','blocked') then raise exception 'Estado de revisão inválido.'; end if;
  if not exists(select 1 from public.user_roles where user_id=p_user_id and role='professor') then
    raise exception 'Solicitação de professor não encontrada.';
  end if;
  insert into public.teacher_verifications(user_id,status,reviewed_by,reviewed_at,admin_note)
  values(p_user_id,p_status,(select auth.uid()),now(),left(coalesce(p_note,''),2000))
  on conflict(user_id) do update set status=excluded.status,reviewed_by=excluded.reviewed_by,reviewed_at=excluded.reviewed_at,admin_note=excluded.admin_note;
  update public.user_roles set status=case when p_status='verified' then 'active'::public.account_status
    when p_status='blocked' then 'blocked'::public.account_status else 'pending'::public.account_status end
    where user_id=p_user_id and role='professor';
  insert into public.notifications(recipient_id,kind,title,body,href) values
    (p_user_id,'teacher_verification',case p_status when 'verified' then 'Perfil docente verificado' when 'rejected' then 'Solicitação docente recusada' when 'blocked' then 'Acesso docente suspenso' else 'Informações adicionais solicitadas' end,
    case when p_status='verified' then 'O administrador confirmou sua condição de professor.' when p_status='blocked' then coalesce(nullif(left(trim(p_note),500),''),'O acesso às ferramentas docentes foi suspenso pelo administrador.') else coalesce(nullif(left(trim(p_note),500),''),'Consulte o administrador do site para saber como prosseguir.') end,'professor.html');
end;
$$;

create or replace function public.request_teacher_reanalysis()
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not exists(select 1 from public.user_roles r join public.teacher_verifications v using(user_id)
    where r.user_id=(select auth.uid()) and r.role='professor' and r.status='pending' and v.status in ('rejected','review')) then
    raise exception 'A solicitação de reanálise não está disponível para esta conta.';
  end if;
  if exists(select 1 from public.teacher_verifications v where v.user_id=(select auth.uid()) and v.requested_at>now()-interval '60 seconds') then
    raise exception 'Aguarde um minuto antes de solicitar outra análise.';
  end if;
  insert into public.teacher_verifications(user_id,status,requested_at,reviewed_by,reviewed_at,admin_note)
  values((select auth.uid()),'review',now(),null,null,'')
  on conflict(user_id) do update set status='review',requested_at=now(),reviewed_by=null,reviewed_at=null,admin_note='';
  update public.user_roles set status='pending' where user_id=(select auth.uid()) and role='professor';
  insert into public.notifications(recipient_id,kind,title,body,href)
  select r.user_id,'teacher_verification','Pedido de reanálise docente','Um professor enviou novo pedido de análise.','admin.html'
  from public.user_roles r where r.role='admin' and r.status='active';
end;
$$;

-- Estas RPCs podem existir em versões anteriores com colunas de retorno diferentes.
-- PostgreSQL não permite alterar o tipo de retorno usando CREATE OR REPLACE.
drop function if exists public.admin_teacher_verifications();
create function public.admin_teacher_verifications()
returns table(user_id uuid,display_name text,email text,status text,requested_at timestamptz,admin_note text)
language plpgsql stable security definer set search_path = '' as $$
begin
  if not public.is_admin() then raise exception 'Apenas o administrador pode consultar as solicitações.'; end if;
  return query select v.user_id,coalesce(p.display_name,'Professor'),u.email::text,v.status,v.requested_at,v.admin_note
    from public.teacher_verifications v join auth.users u on u.id=v.user_id
    left join public.profiles p on p.id=v.user_id
    where v.status in ('pending','review','rejected','verified','blocked') order by v.requested_at desc;
end;
$$;

create or replace function public.admin_set_class_permissions(
  p_classroom uuid,p_can_create_activities boolean,p_can_edit_activities boolean,p_can_publish_activities boolean,
  p_require_activity_approval boolean,p_can_create_lessons boolean,p_can_edit_lessons boolean,
  p_can_send_materials boolean,p_can_view_progress boolean)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_admin() then raise exception 'Apenas o administrador pode definir permissões.'; end if;
  insert into public.class_permissions(classroom_id,can_create_activities,can_edit_activities,can_publish_activities,
    require_activity_approval,can_create_lessons,can_edit_lessons,can_send_materials,can_view_progress,updated_by,updated_at)
  values(p_classroom,p_can_create_activities,p_can_edit_activities,p_can_publish_activities,p_require_activity_approval,
    p_can_create_lessons,p_can_edit_lessons,p_can_send_materials,p_can_view_progress,(select auth.uid()),now())
  on conflict(classroom_id) do update set can_create_activities=excluded.can_create_activities,
    can_edit_activities=excluded.can_edit_activities,can_publish_activities=excluded.can_publish_activities,
    require_activity_approval=excluded.require_activity_approval,can_create_lessons=excluded.can_create_lessons,
    can_edit_lessons=excluded.can_edit_lessons,can_send_materials=excluded.can_send_materials,
    can_view_progress=excluded.can_view_progress,updated_by=excluded.updated_by,updated_at=now();
end;
$$;

drop function if exists public.teacher_submit_activity(uuid,text,text,text,uuid,timestamptz,numeric,boolean);
drop function if exists public.teacher_submit_activity(uuid,text,text,text,uuid,timestamptz,numeric,boolean,boolean);
create or replace function public.teacher_submit_activity(
  p_classroom uuid,p_title text,p_subject text,p_description text,p_animation uuid default null,
  p_due_at timestamptz default null,p_points numeric default 0,p_requires_response boolean default true,p_is_draft boolean default false,
  p_related_lesson uuid default null)
returns uuid language plpgsql security definer set search_path = '' as $$
declare v_id uuid; v_perm public.class_permissions%rowtype; v_approval text;
begin
  if not public.is_verified_teacher_of_class(p_classroom) then raise exception 'Professor verificado e vinculado à turma necessário.'; end if;
  select * into v_perm from public.class_permissions where classroom_id=p_classroom;
  if not coalesce(v_perm.can_create_activities,false) then raise exception 'O administrador não liberou a criação de atividades nesta turma.'; end if;
  if char_length(trim(coalesce(p_title,''))) not between 1 and 160 then raise exception 'Informe um título válido.'; end if;
  if p_points<0 or p_points>100000 then raise exception 'Pontuação inválida.'; end if;
  if p_related_lesson is not null and not exists(select 1 from public.class_lessons l where l.id=p_related_lesson and l.classroom_id=p_classroom) then
    raise exception 'A aula relacionada não pertence a esta turma.';
  end if;
  v_approval:=case when p_is_draft then 'draft' when v_perm.require_activity_approval then 'pending' else 'approved' end;
  insert into public.activities(title,subject,description,animation_id,created_by,approval_status,points,requires_response,is_published,published_at)
  values(left(trim(p_title),160),left(coalesce(p_subject,''),100),left(coalesce(p_description,''),5000),p_animation,
    (select auth.uid()),v_approval,coalesce(p_points,0),coalesce(p_requires_response,true),
    (not p_is_draft and not v_perm.require_activity_approval and v_perm.can_publish_activities),
    case when not p_is_draft and not v_perm.require_activity_approval and v_perm.can_publish_activities then now() else null end)
  returning id into v_id;
  insert into public.classroom_activities(classroom_id,activity_id,assigned_by,due_at,related_lesson_id)
    values(p_classroom,v_id,(select auth.uid()),p_due_at,p_related_lesson);
  if v_approval='pending' then
    insert into public.notifications(recipient_id,kind,title,body,href)
      select r.user_id,'activity_review','Atividade aguardando aprovação',left(trim(p_title),160)||' aguarda análise.','admin.html'
      from public.user_roles r where r.role='admin' and r.status='active';
  end if;
  return v_id;
end;
$$;

create or replace function public.teacher_add_activity_resource(p_activity uuid,p_title text,p_url text)
returns uuid language plpgsql security definer set search_path = '' as $$
declare v_resource uuid; v_classroom uuid;
begin
  select ca.classroom_id into v_classroom from public.classroom_activities ca
  join public.activities a on a.id=ca.activity_id where a.id=p_activity and a.created_by=(select auth.uid()) limit 1;
  if v_classroom is null or not public.teacher_class_can(v_classroom,'create_activities') or exists(
    select 1 from public.classroom_activities ca where ca.activity_id=p_activity and not public.teacher_class_can(ca.classroom_id,'create_activities')) then
    raise exception 'Você não tem permissão para adicionar links à atividade.';
  end if;
  if char_length(trim(coalesce(p_title,''))) not between 1 and 160 or coalesce(p_url,'') !~* '^https://' then
    raise exception 'Informe um título e um link HTTPS válidos.';
  end if;
  insert into public.activity_resources(activity_id,title,resource_url,created_by)
    values(p_activity,left(trim(p_title),160),left(trim(p_url),2000),(select auth.uid())) returning id into v_resource;
  return v_resource;
end;
$$;

create or replace function public.teacher_add_activity_file(p_activity uuid,p_classroom uuid,p_title text,p_path text)
returns uuid language plpgsql security definer set search_path = '' as $$
declare v_resource uuid;
begin
  if not public.teacher_class_can(p_classroom,'create_activities') or not exists(
    select 1 from public.activities a join public.classroom_activities ca on ca.activity_id=a.id
    where a.id=p_activity and a.created_by=(select auth.uid()) and ca.classroom_id=p_classroom) then
    raise exception 'Você não tem permissão para associar este arquivo à atividade.';
  end if;
  if p_path !~ ('^'||p_classroom::text||'/'||(select auth.uid())::text||'/[0-9a-fA-F-]{36}_[A-Za-z0-9._-]{1,180}$')
    or char_length(trim(coalesce(p_title,''))) not between 1 and 160 then
    raise exception 'O arquivo ou seu título não é válido.';
  end if;
  insert into public.activity_resources(activity_id,title,storage_bucket,storage_path,created_by)
    values(p_activity,left(trim(p_title),160),'class-materials',p_path,(select auth.uid())) returning id into v_resource;
  return v_resource;
end;
$$;

drop function if exists public.teacher_submit_existing_activity(uuid);
create function public.teacher_submit_existing_activity(p_activity uuid)
returns text language plpgsql security definer set search_path = '' as $$
declare v_classroom uuid; v_status text; v_require_approval boolean; v_can_publish boolean; v_next text; v_publish boolean;
begin
  select ca.classroom_id,a.approval_status into v_classroom,v_status from public.classroom_activities ca
    join public.activities a on a.id=ca.activity_id where a.id=p_activity and a.created_by=(select auth.uid()) limit 1;
  if v_classroom is null then raise exception 'Atividade não encontrada.'; end if;
  if exists(select 1 from public.classroom_activities ca join public.class_permissions p using(classroom_id)
    where ca.activity_id=p_activity and (not public.is_verified_teacher_of_class(ca.classroom_id) or not p.can_create_activities)) then
    raise exception 'A edição ou reanálise exige acesso e permissão em todas as turmas associadas.';
  end if;
  if v_status not in ('draft','changes_requested','rejected') then raise exception 'Esta atividade não está aguardando reenvio.'; end if;
  select coalesce(bool_or(p.require_activity_approval),true),coalesce(bool_and(p.can_publish_activities),false)
    into v_require_approval,v_can_publish from public.classroom_activities ca
    join public.class_permissions p using(classroom_id) where ca.activity_id=p_activity;
  v_next:=case when v_require_approval or v_status in ('changes_requested','rejected') then 'pending' else 'approved' end;
  v_publish:=v_next='approved' and v_can_publish;
  update public.activities set approval_status=v_next,review_note='',reviewed_by=null,reviewed_at=null,
    is_published=v_publish,published_at=case when v_publish then now() else null end where id=p_activity;
  if v_publish then
    insert into public.notifications(recipient_id,kind,title,body,href)
    select sc.user_id,'new_activity','Nova atividade na turma',a.title,'turma.html?id='||sc.classroom_id::text
    from public.classroom_activities ca join public.student_classrooms sc using(classroom_id)
      join public.activities a on a.id=ca.activity_id where ca.activity_id=p_activity;
  end if;
  return v_next;
end;
$$;

create or replace function public.teacher_set_activity_published(p_activity uuid,p_is_published boolean)
returns void language plpgsql security definer set search_path = '' as $$
declare v_classroom uuid; v_status text; v_title text; v_was_published boolean;
begin
  select ca.classroom_id,a.approval_status,a.title,a.is_published into v_classroom,v_status,v_title,v_was_published
  from public.classroom_activities ca join public.activities a on a.id=ca.activity_id
  where a.id=p_activity and a.created_by=(select auth.uid()) limit 1;
  if v_classroom is null or exists(select 1 from public.classroom_activities ca where ca.activity_id=p_activity
    and not public.teacher_class_can(ca.classroom_id,'publish_activities')) then
    raise exception 'O administrador não liberou a publicação para esta atividade.';
  end if;
  if p_is_published and v_status<>'approved' then raise exception 'A atividade precisa ser aprovada antes da publicação.'; end if;
  update public.activities set is_published=p_is_published,published_at=case when p_is_published then coalesce(published_at,now()) else null end
    where id=p_activity;
  if p_is_published and not v_was_published then
    insert into public.notifications(recipient_id,kind,title,body,href)
    select sc.user_id,'new_activity','Nova atividade na turma',v_title,'turma.html?id='||sc.classroom_id::text
    from public.classroom_activities ca join public.student_classrooms sc using(classroom_id) where ca.activity_id=p_activity;
  end if;
end;
$$;

create or replace function public.teacher_add_activity_question(p_activity uuid,p_prompt text,p_position integer default 0)
returns uuid language plpgsql security definer set search_path = '' as $$
declare v_question uuid; v_class uuid;
begin
  select ca.classroom_id into v_class from public.classroom_activities ca
    join public.activities a on a.id=ca.activity_id where a.id=p_activity and a.created_by=(select auth.uid()) limit 1;
  if v_class is null or not public.teacher_class_can(v_class,'create_activities') or exists(
    select 1 from public.classroom_activities ca where ca.activity_id=p_activity and not public.teacher_class_can(ca.classroom_id,'create_activities')) then
    raise exception 'Você não pode incluir questões nesta atividade.';
  end if;
  if char_length(trim(coalesce(p_prompt,''))) not between 1 and 3000 then raise exception 'Escreva uma questão válida.'; end if;
  insert into public.activity_questions(activity_id,prompt,position)
    values(p_activity,left(trim(p_prompt),3000),greatest(coalesce(p_position,0),0)) returning id into v_question;
  return v_question;
end;
$$;

create or replace function public.admin_review_activity(p_activity uuid,p_status text,p_note text default '')
returns void language plpgsql security definer set search_path = '' as $$
declare v_owner uuid; v_title text;
begin
  if not public.is_admin() then raise exception 'Apenas o administrador pode revisar atividades.'; end if;
  if p_status not in ('approved','changes_requested','rejected') then raise exception 'Estado de revisão inválido.'; end if;
  update public.activities set approval_status=p_status,review_note=left(coalesce(p_note,''),2000),reviewed_by=(select auth.uid()),reviewed_at=now(),
    is_published=(p_status='approved'),published_at=case when p_status='approved' then now() else null end
    where id=p_activity and created_by is not null returning created_by,title into v_owner,v_title;
  if not found then raise exception 'Atividade não encontrada.'; end if;
  insert into public.notifications(recipient_id,kind,title,body,href) values
    (v_owner,'activity_review',case p_status when 'approved' then 'Atividade aprovada' when 'rejected' then 'Atividade recusada' else 'Alterações solicitadas' end,
    case p_status when 'approved' then left(v_title,160)||' foi aprovada e publicada.' when 'rejected' then coalesce(nullif(left(trim(p_note),500),''),'A atividade foi recusada.') else coalesce(nullif(left(trim(p_note),500),''),'Revise a atividade e envie novamente.') end,'professor.html');
  if p_status='approved' then
    insert into public.notifications(recipient_id,kind,title,body,href)
    select sc.user_id,'new_activity','Nova atividade na turma',v_title,'turma.html?id='||ca.classroom_id::text
    from public.classroom_activities ca join public.student_classrooms sc using(classroom_id)
    where ca.activity_id=p_activity;
  end if;
end;
$$;

drop function if exists public.get_classroom_roster(uuid);
create function public.get_classroom_roster(p_classroom uuid)
returns table(person_id uuid,display_name text,participant_role text)
language plpgsql stable security definer set search_path = '' as $$
begin
  if not public.is_admin() and not public.is_teacher_of_class(p_classroom) and not public.is_student_of_class(p_classroom) then
    raise exception 'Você não tem acesso aos participantes desta turma.';
  end if;
  return query
    select t.user_id,coalesce(p.display_name,'Professor'),'professor'::text
    from public.teacher_classrooms t join public.profiles p on p.id=t.user_id where t.classroom_id=p_classroom
    union all
    select s.user_id,coalesce(p.display_name,'Aluno'),'aluno'::text
    from public.student_classrooms s join public.profiles p on p.id=s.user_id where s.classroom_id=p_classroom
      and (public.is_admin() or s.user_id=(select auth.uid()) or (public.is_teacher_of_class(p_classroom) and exists(
        select 1 from public.class_permissions cp where cp.classroom_id=p_classroom and cp.can_view_progress)));
end;
$$;

create or replace function public.get_classroom_student_count(p_classroom uuid)
returns integer language plpgsql stable security definer set search_path = '' as $$
declare v_count integer;
begin
  if not public.is_admin() and not public.is_teacher_of_class(p_classroom) and not public.is_student_of_class(p_classroom) then
    raise exception 'Você não tem acesso a esta turma.';
  end if;
  select count(*)::integer into v_count from public.student_classrooms where classroom_id=p_classroom;
  return coalesce(v_count,0);
end;
$$;

create or replace function public.teacher_class_can(p_classroom uuid,p_permission text)
returns boolean language sql stable security definer set search_path = '' as $$
  select public.is_verified_teacher_of_class(p_classroom) and exists(
    select 1 from public.class_permissions p where p.classroom_id=p_classroom and
    case p_permission when 'create_activities' then p.can_create_activities when 'edit_activities' then p.can_edit_activities
      when 'publish_activities' then p.can_publish_activities when 'create_lessons' then p.can_create_lessons
      when 'edit_lessons' then p.can_edit_lessons when 'send_materials' then p.can_send_materials
      when 'view_progress' then p.can_view_progress else false end);
$$;

-- Evita recursão entre as políticas de activities e classroom_activities.
-- Essas consultas internas usam SECURITY DEFINER para não reavaliar RLS em ciclo.
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

create or replace function public.notify_class_activity()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.notifications(recipient_id,kind,title,body,href)
  select sc.user_id,'new_activity','Nova atividade na turma',a.title,'turma.html?id='||new.classroom_id::text
  from public.student_classrooms sc join public.activities a on a.id=new.activity_id
  where sc.classroom_id=new.classroom_id and a.is_published and a.approval_status='approved';
  return new;
end;
$$;
drop trigger if exists classroom_activity_notify_students on public.classroom_activities;
create trigger classroom_activity_notify_students after insert on public.classroom_activities
for each row execute function public.notify_class_activity();

create or replace function public.notify_class_join()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.notifications(recipient_id,kind,title,body,href)
  select tc.user_id,'new_student','Novo aluno na turma',coalesce(p.display_name,'Um estudante')||' entrou na turma.','turma.html?id='||new.classroom_id::text
  from public.teacher_classrooms tc
  join public.user_roles r on r.user_id=tc.user_id and r.role='professor' and r.status='active'
  join public.teacher_verifications v on v.user_id=tc.user_id and v.status='verified'
  left join public.profiles p on p.id=new.user_id
  where tc.classroom_id=new.classroom_id;
  return new;
end;
$$;
drop trigger if exists student_classroom_notify_teachers on public.student_classrooms;
create trigger student_classroom_notify_teachers after insert on public.student_classrooms
for each row execute function public.notify_class_join();

create or replace function public.notify_class_content()
returns trigger language plpgsql security definer set search_path = '' as $$
declare v_kind text; v_title text; v_href text;
begin
  if tg_table_name='class_lessons' then v_kind:='new_lesson'; v_title:='Nova aula: '||new.title;
  else v_kind:='new_notice'; v_title:='Novo aviso: '||new.title; end if;
  v_href:='turma.html?id='||new.classroom_id::text;
  insert into public.notifications(recipient_id,kind,title,body,href)
  select sc.user_id,v_kind,left(v_title,160),case when tg_table_name='class_lessons' then left(coalesce(new.body,''),500) else left(coalesce(new.body,''),500) end,v_href
  from public.student_classrooms sc where sc.classroom_id=new.classroom_id;
  return new;
end;
$$;
drop trigger if exists class_lesson_notify_students on public.class_lessons;
create trigger class_lesson_notify_students after insert on public.class_lessons
for each row when (new.is_published) execute function public.notify_class_content();
drop trigger if exists class_announcement_notify_students on public.class_announcements;
create trigger class_announcement_notify_students after insert on public.class_announcements
for each row execute function public.notify_class_content();

create or replace function public.notify_student_feedback()
returns trigger language plpgsql security definer set search_path = '' as $$
declare v_submission public.activity_submissions%rowtype;
begin
  if tg_op='UPDATE' then
    if new.feedback is not distinct from old.feedback then return new; end if;
  end if;
  select * into v_submission from public.activity_submissions where id=new.submission_id;
  if v_submission.id is not null then
    insert into public.notifications(recipient_id,kind,title,body,href)
    select v_submission.student_id,'activity_feedback','Sua atividade recebeu uma devolutiva',left(coalesce(new.feedback,''),500),
      'turma.html?id='||v_submission.classroom_id::text;
  end if;
  return new;
end;
$$;
drop trigger if exists submission_feedback_notify_student on public.submission_feedback;
create trigger submission_feedback_notify_student after insert or update on public.submission_feedback
for each row execute function public.notify_student_feedback();

create or replace function public.protect_activity_review_fields()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_admin() then
    if new.approval_status is distinct from old.approval_status and new.approval_status not in ('draft','pending') then
      if not (old.approval_status='draft' and new.approval_status='approved' and exists(
        select 1 from public.classroom_activities ca join public.class_permissions p using(classroom_id)
        where ca.activity_id=old.id and public.teacher_class_can(ca.classroom_id,'create_activities') and not p.require_activity_approval)) then
        raise exception 'Somente o administrador pode aprovar uma atividade.';
      end if;
    end if;
    if (new.approval_status in ('draft','pending') and new.is_published)
      or (new.review_note is distinct from old.review_note and new.review_note<>'')
      or (new.reviewed_by is distinct from old.reviewed_by and new.reviewed_by is not null)
      or (new.reviewed_at is distinct from old.reviewed_at and new.reviewed_at is not null) then
      raise exception 'Somente o administrador pode aprovar uma atividade.';
    end if;
  end if;
  if not public.is_admin() and new.is_published and new.is_published is distinct from old.is_published then
    if not exists(select 1 from public.classroom_activities ca where ca.activity_id=old.id
      and public.teacher_class_can(ca.classroom_id,'publish_activities')) or new.approval_status<>'approved' then
      raise exception 'Publicação não autorizada para esta atividade.';
    end if;
  end if;
  return new;
end;
$$;
drop trigger if exists activities_protect_review_fields on public.activities;
create trigger activities_protect_review_fields before update on public.activities
for each row execute function public.protect_activity_review_fields();

create or replace function public.notify_activity_resubmission()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.approval_status='pending' and old.approval_status is distinct from 'pending' then
    insert into public.notifications(recipient_id,kind,title,body,href)
    select r.user_id,'activity_review','Atividade enviada para aprovação',left(new.title,160)||' aguarda nova análise.','admin.html'
    from public.user_roles r where r.role='admin' and r.status='active';
  end if;
  return new;
end;
$$;
drop trigger if exists activities_notify_resubmission on public.activities;
create trigger activities_notify_resubmission after update on public.activities
for each row execute function public.notify_activity_resubmission();

-- Replace the broad legacy policies with admin control and class-scoped access.
drop policy if exists classrooms_insert_teacher on public.classrooms;
drop policy if exists classrooms_update_teacher_admin on public.classrooms;
drop policy if exists classrooms_delete_teacher_admin on public.classrooms;
drop policy if exists classrooms_read_member_or_admin on public.classrooms;
drop policy if exists classrooms_admin_insert on public.classrooms;
drop policy if exists classrooms_admin_update on public.classrooms;
drop policy if exists classrooms_admin_delete on public.classrooms;
create policy classrooms_read_member_or_admin on public.classrooms for select to authenticated
  using (public.is_admin() or public.is_teacher_of_class(id) or public.is_student_of_class(id));
create policy classrooms_admin_insert on public.classrooms for insert to authenticated
  with check (public.is_admin() and created_by=(select auth.uid()));
create policy classrooms_admin_update on public.classrooms for update to authenticated
  using (public.is_admin()) with check (public.is_admin());
create policy classrooms_admin_delete on public.classrooms for delete to authenticated using (public.is_admin());

drop policy if exists teacher_classrooms_read_related on public.teacher_classrooms;
drop policy if exists teacher_classrooms_insert_owner_or_admin on public.teacher_classrooms;
drop policy if exists teacher_classrooms_delete_owner_admin on public.teacher_classrooms;
drop policy if exists teacher_classrooms_admin_insert on public.teacher_classrooms;
drop policy if exists teacher_classrooms_admin_delete on public.teacher_classrooms;
create policy teacher_classrooms_read_related on public.teacher_classrooms for select to authenticated
  using (public.is_admin() or user_id=(select auth.uid()) or public.is_teacher_of_class(classroom_id));
create policy teacher_classrooms_admin_insert on public.teacher_classrooms for insert to authenticated
  with check (public.is_admin() and exists(select 1 from public.user_roles r where r.user_id=user_id and r.role='professor' and r.status='active'));
create policy teacher_classrooms_admin_delete on public.teacher_classrooms for delete to authenticated using (public.is_admin());

drop policy if exists student_classrooms_read_related on public.student_classrooms;
drop policy if exists student_classrooms_teacher_enroll on public.student_classrooms;
drop policy if exists student_classrooms_leave_or_remove on public.student_classrooms;
drop policy if exists student_classrooms_admin_insert on public.student_classrooms;
drop policy if exists student_classrooms_delete_self_or_admin on public.student_classrooms;
create policy student_classrooms_read_related on public.student_classrooms for select to authenticated
  using (public.is_admin() or user_id=(select auth.uid()) or (public.is_teacher_of_class(classroom_id) and exists(
    select 1 from public.class_permissions p where p.classroom_id=student_classrooms.classroom_id and p.can_view_progress)));
create policy student_classrooms_admin_insert on public.student_classrooms for insert to authenticated
  with check (public.is_admin() and exists(select 1 from public.user_roles r where r.user_id=user_id and r.role='aluno' and r.status='active'));
create policy student_classrooms_delete_self_or_admin on public.student_classrooms for delete to authenticated
  using (public.is_admin() or user_id=(select auth.uid()));

drop policy if exists activities_read_creator_admin_or_assigned on public.activities;
drop policy if exists activities_teacher_insert_own on public.activities;
drop policy if exists activities_editor_update on public.activities;
drop policy if exists activities_editor_delete on public.activities;
drop policy if exists activities_read_scoped on public.activities;
drop policy if exists activities_admin_insert on public.activities;
drop policy if exists activities_admin_update on public.activities;
drop policy if exists activities_teacher_update_scoped on public.activities;
drop policy if exists activities_admin_delete on public.activities;
drop policy if exists activities_teacher_delete_scoped on public.activities;
create policy activities_read_scoped on public.activities for select to authenticated
  using (public.is_admin() or created_by=(select auth.uid()) or (is_published and approval_status='approved')
    or public.activity_has_teacher_assignment(id));
create policy activities_admin_insert on public.activities for insert to authenticated with check (public.is_admin());
create policy activities_admin_update on public.activities for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy activities_teacher_update_scoped on public.activities for update to authenticated using (
  created_by=(select auth.uid()) and public.teacher_can_manage_activity(id,'edit_activities'))
  with check (created_by=(select auth.uid()) and public.teacher_can_manage_activity(id,'edit_activities'));
create policy activities_admin_delete on public.activities for delete to authenticated using (public.is_admin());
create policy activities_teacher_delete_scoped on public.activities for delete to authenticated using (
  created_by=(select auth.uid()) and public.teacher_can_manage_activity(id,'edit_activities'));

drop policy if exists classroom_activities_read_member on public.classroom_activities;
drop policy if exists classroom_activities_teacher_assign on public.classroom_activities;
drop policy if exists classroom_activities_teacher_unassign on public.classroom_activities;
drop policy if exists classroom_activities_read_member on public.classroom_activities;
drop policy if exists classroom_activities_admin_insert on public.classroom_activities;
drop policy if exists classroom_activities_teacher_insert_scoped on public.classroom_activities;
drop policy if exists classroom_activities_admin_delete on public.classroom_activities;
drop policy if exists classroom_activities_teacher_delete_scoped on public.classroom_activities;
create policy classroom_activities_read_member on public.classroom_activities for select to authenticated
  using (public.is_admin() or public.is_teacher_of_class(classroom_id) or (public.is_student_of_class(classroom_id)
    and public.activity_is_published_approved(activity_id)));
create policy classroom_activities_admin_insert on public.classroom_activities for insert to authenticated with check (public.is_admin());
create policy classroom_activities_teacher_insert_scoped on public.classroom_activities for insert to authenticated with check (
  assigned_by=(select auth.uid()) and public.teacher_class_can(classroom_id,'create_activities')
    and public.activity_is_owned_by(activity_id) and public.activity_is_published_approved(activity_id));
create policy classroom_activities_admin_delete on public.classroom_activities for delete to authenticated using (public.is_admin());
create policy classroom_activities_teacher_delete_scoped on public.classroom_activities for delete to authenticated using (
  public.teacher_class_can(classroom_id,'edit_activities') and public.activity_is_owned_by(activity_id));

drop policy if exists submissions_read_student_teacher_admin on public.activity_submissions;
drop policy if exists submissions_read_scoped on public.activity_submissions;
create policy submissions_read_scoped on public.activity_submissions for select to authenticated
  using (student_id=(select auth.uid()) or public.is_admin() or (public.is_teacher_of_class(classroom_id)
    and exists(select 1 from public.class_permissions p where p.classroom_id=activity_submissions.classroom_id and p.can_view_progress)));

drop policy if exists feedback_teacher_insert on public.submission_feedback;
drop policy if exists feedback_teacher_update on public.submission_feedback;
drop policy if exists feedback_teacher_insert_scoped on public.submission_feedback;
drop policy if exists feedback_teacher_update_scoped on public.submission_feedback;
create policy feedback_teacher_insert_scoped on public.submission_feedback for insert to authenticated
  with check (teacher_id=(select auth.uid()) and exists(select 1 from public.activity_submissions s
    where s.id=submission_id and public.teacher_class_can(s.classroom_id,'view_progress')));
create policy feedback_teacher_update_scoped on public.submission_feedback for update to authenticated
  using (public.is_admin() or (teacher_id=(select auth.uid()) and exists(select 1 from public.activity_submissions s
    where s.id=submission_id and public.teacher_class_can(s.classroom_id,'view_progress'))))
  with check (public.is_admin() or (teacher_id=(select auth.uid()) and exists(select 1 from public.activity_submissions s
    where s.id=submission_id and public.teacher_class_can(s.classroom_id,'view_progress'))));

alter table public.class_permissions enable row level security;
alter table public.teacher_verifications enable row level security;
alter table public.notifications enable row level security;
alter table public.class_announcements enable row level security;
alter table public.class_resources enable row level security;
alter table public.class_lessons enable row level security;
alter table public.activity_questions enable row level security;
alter table public.activity_resources enable row level security;
alter table public.site_settings enable row level security;

drop policy if exists class_permissions_read_related on public.class_permissions;
drop policy if exists class_permissions_admin_insert on public.class_permissions;
drop policy if exists class_permissions_admin_update on public.class_permissions;
drop policy if exists class_permissions_admin_delete on public.class_permissions;
create policy class_permissions_read_related on public.class_permissions for select to authenticated
  using (public.is_admin() or public.is_teacher_of_class(classroom_id) or public.is_student_of_class(classroom_id));
create policy class_permissions_admin_insert on public.class_permissions for insert to authenticated with check (public.is_admin());
create policy class_permissions_admin_update on public.class_permissions for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy class_permissions_admin_delete on public.class_permissions for delete to authenticated using (public.is_admin());

drop policy if exists teacher_verifications_self_or_admin_read on public.teacher_verifications;
drop policy if exists teacher_verifications_admin_insert on public.teacher_verifications;
drop policy if exists teacher_verifications_admin_update on public.teacher_verifications;
drop policy if exists teacher_verifications_admin_delete on public.teacher_verifications;
create policy teacher_verifications_self_or_admin_read on public.teacher_verifications for select to authenticated
  using (user_id=(select auth.uid()) or public.is_admin());
create policy teacher_verifications_admin_insert on public.teacher_verifications for insert to authenticated with check (public.is_admin());
create policy teacher_verifications_admin_update on public.teacher_verifications for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy teacher_verifications_admin_delete on public.teacher_verifications for delete to authenticated using (public.is_admin());

drop policy if exists notifications_read_self on public.notifications;
drop policy if exists notifications_update_self on public.notifications;
drop policy if exists notifications_delete_self on public.notifications;
create policy notifications_read_self on public.notifications for select to authenticated using (
  recipient_id=(select auth.uid()) and exists(select 1 from public.user_roles r where r.user_id=(select auth.uid()) and r.status<>'blocked'));
create policy notifications_update_self on public.notifications for update to authenticated using (
  recipient_id=(select auth.uid()) and exists(select 1 from public.user_roles r where r.user_id=(select auth.uid()) and r.status<>'blocked'))
  with check (recipient_id=(select auth.uid()) and exists(select 1 from public.user_roles r where r.user_id=(select auth.uid()) and r.status<>'blocked'));
create policy notifications_delete_self on public.notifications for delete to authenticated using (
  recipient_id=(select auth.uid()) and exists(select 1 from public.user_roles r where r.user_id=(select auth.uid()) and r.status<>'blocked'));

drop policy if exists class_announcements_read_members on public.class_announcements;
drop policy if exists class_announcements_admin_manage on public.class_announcements;
drop policy if exists class_announcements_teacher_insert on public.class_announcements;
create policy class_announcements_read_members on public.class_announcements for select to authenticated
  using (public.is_admin() or public.is_teacher_of_class(classroom_id) or public.is_student_of_class(classroom_id));
create policy class_announcements_admin_manage on public.class_announcements for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
create policy class_announcements_teacher_insert on public.class_announcements for insert to authenticated
  with check (created_by=(select auth.uid()) and public.teacher_class_can(classroom_id,'send_materials'));

drop policy if exists class_resources_read_members on public.class_resources;
drop policy if exists class_resources_admin_manage on public.class_resources;
drop policy if exists class_resources_teacher_insert on public.class_resources;
create policy class_resources_read_members on public.class_resources for select to authenticated
  using (public.is_admin() or public.is_teacher_of_class(classroom_id) or public.is_student_of_class(classroom_id));
create policy class_resources_admin_manage on public.class_resources for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
create policy class_resources_teacher_insert on public.class_resources for insert to authenticated
  with check (created_by=(select auth.uid()) and public.teacher_class_can(classroom_id,'send_materials'));

drop policy if exists activity_questions_read_scoped on public.activity_questions;
drop policy if exists activity_questions_admin_manage on public.activity_questions;
create policy activity_questions_read_scoped on public.activity_questions for select to authenticated using (
  public.is_admin() or exists(select 1 from public.activities a where a.id=activity_id and a.created_by=(select auth.uid()))
  or exists(select 1 from public.classroom_activities ca join public.activities a on a.id=ca.activity_id
    where ca.activity_id=activity_questions.activity_id and a.is_published and a.approval_status='approved' and public.is_student_of_class(ca.classroom_id)));
create policy activity_questions_admin_manage on public.activity_questions for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists activity_resources_read_scoped on public.activity_resources;
drop policy if exists activity_resources_admin_manage on public.activity_resources;
drop policy if exists activity_resources_teacher_insert on public.activity_resources;
create policy activity_resources_read_scoped on public.activity_resources for select to authenticated using (
  public.is_admin() or exists(select 1 from public.activities a where a.id=activity_id and a.created_by=(select auth.uid()))
  or exists(select 1 from public.classroom_activities ca join public.activities a on a.id=ca.activity_id
    where ca.activity_id=activity_resources.activity_id and a.is_published and a.approval_status='approved' and public.is_student_of_class(ca.classroom_id))
  or exists(select 1 from public.classroom_activities ca where ca.activity_id=activity_resources.activity_id and public.is_teacher_of_class(ca.classroom_id)));
create policy activity_resources_admin_manage on public.activity_resources for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy activity_resources_teacher_insert on public.activity_resources for insert to authenticated
  with check (created_by=(select auth.uid()) and exists(select 1 from public.classroom_activities ca where ca.activity_id=activity_resources.activity_id
    and public.teacher_class_can(ca.classroom_id,'create_activities')) and exists(select 1 from public.activities a
    where a.id=activity_resources.activity_id and a.created_by=(select auth.uid())));

drop policy if exists "DBN class materials upload" on storage.objects;
drop policy if exists "DBN class materials read by membership" on storage.objects;
drop policy if exists "DBN class materials delete by owner or admin" on storage.objects;
create policy "DBN class materials upload" on storage.objects for insert to authenticated
  with check (bucket_id='class-materials' and (public.is_admin() or (
    name ~ '^[0-9a-fA-F-]{36}/[0-9a-fA-F-]{36}/[0-9a-fA-F-]{36}_[A-Za-z0-9._-]{1,180}$'
    and split_part(name,'/',2)=(select auth.uid())::text
    and exists(select 1 from public.classrooms c where c.id::text=split_part(name,'/',1)
      and public.teacher_class_can(c.id,'create_activities')))));
create policy "DBN class materials read by membership" on storage.objects for select to authenticated
  using (bucket_id='class-materials' and (public.is_admin() or exists(
    select 1 from public.activity_resources r join public.activities a on a.id=r.activity_id
      join public.classroom_activities ca on ca.activity_id=a.id
    where r.storage_bucket='class-materials' and r.storage_path=storage.objects.name and
      (public.is_teacher_of_class(ca.classroom_id) or (public.is_student_of_class(ca.classroom_id)
        and a.is_published and a.approval_status='approved')))));
create policy "DBN class materials delete by owner or admin" on storage.objects for delete to authenticated
  using (bucket_id='class-materials' and (public.is_admin() or (
    split_part(name,'/',2)=(select auth.uid())::text
    and exists(select 1 from public.classrooms c where c.id::text=split_part(name,'/',1)
      and public.teacher_class_can(c.id,'create_activities')))));

drop policy if exists class_lessons_read_members on public.class_lessons;
drop policy if exists class_lessons_admin_manage on public.class_lessons;
drop policy if exists class_lessons_teacher_insert on public.class_lessons;
drop policy if exists class_lessons_teacher_update on public.class_lessons;
create policy class_lessons_read_members on public.class_lessons for select to authenticated
  using (public.is_admin() or public.is_teacher_of_class(classroom_id) or (public.is_student_of_class(classroom_id) and is_published));
create policy class_lessons_admin_manage on public.class_lessons for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy class_lessons_teacher_insert on public.class_lessons for insert to authenticated
  with check (created_by=(select auth.uid()) and public.teacher_class_can(classroom_id,'create_lessons'));
create policy class_lessons_teacher_update on public.class_lessons for update to authenticated
  using (created_by=(select auth.uid()) and public.teacher_class_can(classroom_id,'edit_lessons'))
  with check (created_by=(select auth.uid()) and public.teacher_class_can(classroom_id,'edit_lessons'));

drop policy if exists site_settings_public_pix_read on public.site_settings;
drop policy if exists site_settings_admin_manage on public.site_settings;
create policy site_settings_public_pix_read on public.site_settings for select to anon,authenticated using (key='pix');
create policy site_settings_admin_manage on public.site_settings for all to authenticated using (public.is_admin()) with check (public.is_admin());

grant select,insert,update,delete on public.class_permissions,public.teacher_verifications,public.notifications,
  public.class_announcements,public.class_resources,public.class_lessons,public.activity_questions,public.activity_resources,public.site_settings to authenticated;
revoke update on public.notifications from authenticated;
grant update(read_at) on public.notifications to authenticated;
grant select on public.site_settings to anon;
revoke all on function public.generate_class_join_code() from public,anon;
revoke all on function public.create_classroom(text,text) from public,anon;
revoke all on function public.join_class_by_code(text) from public,anon;
revoke all on function public.admin_regenerate_class_code(uuid) from public,anon;
revoke all on function public.admin_review_teacher(uuid,text,text) from public,anon;
revoke all on function public.admin_teacher_verifications() from public,anon;
revoke all on function public.request_teacher_reanalysis() from public,anon;
revoke all on function public.notify_student_upcoming_deadlines() from public,anon;
revoke all on function public.admin_set_class_permissions(uuid,boolean,boolean,boolean,boolean,boolean,boolean,boolean,boolean) from public,anon;
revoke all on function public.teacher_submit_activity(uuid,text,text,text,uuid,timestamptz,numeric,boolean,boolean,uuid) from public,anon;
revoke all on function public.teacher_submit_existing_activity(uuid) from public,anon;
revoke all on function public.teacher_set_activity_published(uuid,boolean) from public,anon;
revoke all on function public.teacher_add_activity_question(uuid,text,integer) from public,anon;
revoke all on function public.teacher_add_activity_resource(uuid,text,text) from public,anon;
revoke all on function public.teacher_add_activity_file(uuid,uuid,text,text) from public,anon;
revoke all on function public.admin_review_activity(uuid,text,text) from public,anon;
revoke all on function public.teacher_class_can(uuid,text) from public,anon;
revoke all on function public.activity_is_published_approved(uuid) from public,anon;
revoke all on function public.activity_is_owned_by(uuid) from public,anon;
revoke all on function public.activity_has_teacher_assignment(uuid) from public,anon;
revoke all on function public.teacher_can_manage_activity(uuid,text) from public,anon;
revoke all on function public.get_classroom_roster(uuid) from public,anon;
revoke all on function public.get_classroom_student_count(uuid) from public,anon;
grant execute on function public.generate_class_join_code() to authenticated;
grant execute on function public.create_classroom(text,text) to authenticated;
grant execute on function public.join_class_by_code(text) to authenticated;
grant execute on function public.admin_regenerate_class_code(uuid) to authenticated;
grant execute on function public.admin_review_teacher(uuid,text,text) to authenticated;
grant execute on function public.admin_teacher_verifications() to authenticated;
grant execute on function public.request_teacher_reanalysis() to authenticated;
grant execute on function public.notify_student_upcoming_deadlines() to authenticated;
grant execute on function public.admin_set_class_permissions(uuid,boolean,boolean,boolean,boolean,boolean,boolean,boolean,boolean) to authenticated;
grant execute on function public.teacher_submit_activity(uuid,text,text,text,uuid,timestamptz,numeric,boolean,boolean,uuid) to authenticated;
grant execute on function public.teacher_submit_existing_activity(uuid) to authenticated;
grant execute on function public.teacher_set_activity_published(uuid,boolean) to authenticated;
grant execute on function public.teacher_add_activity_question(uuid,text,integer) to authenticated;
grant execute on function public.teacher_add_activity_resource(uuid,text,text) to authenticated;
grant execute on function public.teacher_add_activity_file(uuid,uuid,text,text) to authenticated;
grant execute on function public.admin_review_activity(uuid,text,text) to authenticated;
grant execute on function public.teacher_class_can(uuid,text) to authenticated;
grant execute on function public.activity_is_published_approved(uuid) to authenticated;
grant execute on function public.activity_is_owned_by(uuid) to authenticated;
grant execute on function public.activity_has_teacher_assignment(uuid) to authenticated;
grant execute on function public.teacher_can_manage_activity(uuid,text) to authenticated;
grant execute on function public.get_classroom_roster(uuid) to authenticated;
grant execute on function public.get_classroom_student_count(uuid) to authenticated;
notify pgrst, 'reload schema';
commit;

