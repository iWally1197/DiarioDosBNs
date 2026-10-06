-- Atualização incremental do Diário dos BNs.
-- Execute depois da migração core. Pode ser reaplicada sem recriar tabelas.
begin;

alter table public.profiles
  add column if not exists age_range text,
  add column if not exists education_level text,
  add column if not exists education_detail text,
  add column if not exists teacher_degree_level text,
  add column if not exists teacher_degree_program text,
  add column if not exists teacher_institution text;

alter table public.classrooms
  add column if not exists education_level text not null default 'Ensino Médio';

do $$
begin
  if not exists (select 1 from pg_constraint where conname='profiles_age_range_allowed' and conrelid='public.profiles'::regclass) then
    alter table public.profiles add constraint profiles_age_range_allowed
      check (age_range is null or age_range in ('Até 12 anos','13 a 15 anos','16 a 17 anos','18 a 24 anos','25 a 39 anos','40 anos ou mais'));
  end if;
  if not exists (select 1 from pg_constraint where conname='profiles_education_level_allowed' and conrelid='public.profiles'::regclass) then
    alter table public.profiles add constraint profiles_education_level_allowed
      check (education_level is null or education_level in ('Ensino Fundamental I','Ensino Fundamental II','Ensino Médio','Ensino Técnico','Ensino Superior','Pós-graduação','Outro'));
  end if;
  if not exists (select 1 from pg_constraint where conname='profiles_teacher_degree_allowed' and conrelid='public.profiles'::regclass) then
    alter table public.profiles add constraint profiles_teacher_degree_allowed
      check (teacher_degree_level is null or teacher_degree_level in ('Bacharelado','Licenciatura','Tecnólogo','Especialização','Mestrado acadêmico','Mestrado profissional','Doutorado acadêmico','Doutorado profissional','Ainda cursando graduação','Outro'));
  end if;
  if not exists (select 1 from pg_constraint where conname='profiles_education_detail_length' and conrelid='public.profiles'::regclass) then
    alter table public.profiles add constraint profiles_education_detail_length
      check (education_detail is null or char_length(education_detail) <= 100);
  end if;
  if not exists (select 1 from pg_constraint where conname='profiles_teacher_course_length' and conrelid='public.profiles'::regclass) then
    alter table public.profiles add constraint profiles_teacher_course_length
      check (teacher_degree_program is null or char_length(teacher_degree_program) <= 160);
  end if;
  if not exists (select 1 from pg_constraint where conname='profiles_teacher_institution_length' and conrelid='public.profiles'::regclass) then
    alter table public.profiles add constraint profiles_teacher_institution_length
      check (teacher_institution is null or char_length(teacher_institution) <= 160);
  end if;
  if not exists (select 1 from pg_constraint where conname='classrooms_education_level_allowed' and conrelid='public.classrooms'::regclass) then
    alter table public.classrooms add constraint classrooms_education_level_allowed
      check (education_level in ('Ensino Fundamental I','Ensino Fundamental II','Ensino Médio','Ensino Técnico','Ensino Superior','Pós-graduação','Outro'));
  end if;
end;
$$;

-- Preenche dados que já tenham sido gravados no metadata da conta.
update public.profiles p
set age_range=coalesce(p.age_range,case when u.raw_user_meta_data->>'age_range' in ('Até 12 anos','13 a 15 anos','16 a 17 anos','18 a 24 anos','25 a 39 anos','40 anos ou mais') then u.raw_user_meta_data->>'age_range' end),
    education_level=coalesce(p.education_level,case when u.raw_user_meta_data->>'education_level' in ('Ensino Fundamental I','Ensino Fundamental II','Ensino Médio','Ensino Técnico','Ensino Superior','Pós-graduação','Outro') then u.raw_user_meta_data->>'education_level' end),
    education_detail=coalesce(p.education_detail,nullif(left(coalesce(u.raw_user_meta_data->>'education_detail',''),100),'')),
    teacher_degree_level=coalesce(p.teacher_degree_level,case when u.raw_user_meta_data->>'teacher_degree_level' in ('Bacharelado','Licenciatura','Tecnólogo','Especialização','Mestrado acadêmico','Mestrado profissional','Doutorado acadêmico','Doutorado profissional','Ainda cursando graduação','Outro') then u.raw_user_meta_data->>'teacher_degree_level' end),
    teacher_degree_program=coalesce(p.teacher_degree_program,nullif(left(coalesce(u.raw_user_meta_data->>'teacher_degree_program',''),160),'')),
    teacher_institution=coalesce(p.teacher_institution,nullif(left(coalesce(u.raw_user_meta_data->>'teacher_institution',''),160),''))
from auth.users u where u.id=p.id;

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
  insert into public.profiles(
    id,display_name,terms_version,privacy_version,age_range,education_level,education_detail,
    teacher_degree_level,teacher_degree_program,teacher_institution
  ) values(
    new.id,left(coalesce(new.raw_user_meta_data->>'display_name',''),100),'1.0','1.0',
    nullif(new.raw_user_meta_data->>'age_range',''),
    nullif(new.raw_user_meta_data->>'education_level',''),
    nullif(left(coalesce(new.raw_user_meta_data->>'education_detail',''),100),''),
    nullif(new.raw_user_meta_data->>'teacher_degree_level',''),
    nullif(left(coalesce(new.raw_user_meta_data->>'teacher_degree_program',''),160),''),
    nullif(left(coalesce(new.raw_user_meta_data->>'teacher_institution',''),160),'')
  );
  insert into public.user_roles(user_id,role,status) values(new.id,v_role,v_status);
  return new;
end;
$$;

grant select(age_range,education_level,education_detail,teacher_degree_level,teacher_degree_program,teacher_institution) on public.profiles to authenticated;
grant update(age_range,education_level,education_detail,teacher_degree_level,teacher_degree_program,teacher_institution) on public.profiles to authenticated;

create or replace function public.create_classroom(p_name text,p_description text,p_education_level text)
returns table(id uuid,name text,join_code text)
language plpgsql security definer set search_path = '' as $$
declare v_id uuid;
begin
  if not public.has_active_role('professor'::public.account_role) then raise exception 'Aprovação docente necessária.'; end if;
  if nullif(trim(coalesce(p_name,'')),'') is null then raise exception 'Informe o nome da turma.'; end if;
  if p_education_level is null or p_education_level not in ('Ensino Fundamental I','Ensino Fundamental II','Ensino Médio','Ensino Técnico','Ensino Superior','Pós-graduação','Outro') then
    raise exception 'Selecione uma etapa de ensino válida.';
  end if;
  insert into public.classrooms(name,description,education_level,created_by)
    values(left(trim(p_name),100),left(coalesce(p_description,''),1000),p_education_level,(select auth.uid()))
    returning classrooms.id into v_id;
  insert into public.teacher_classrooms(classroom_id,user_id) values(v_id,(select auth.uid()));
  return query select c.id,c.name,c.join_code from public.classrooms c where c.id=v_id;
end;
$$;

revoke all on function public.create_classroom(text,text,text) from public,anon;
grant execute on function public.create_classroom(text,text,text) to authenticated;

notify pgrst, 'reload schema';
commit;
