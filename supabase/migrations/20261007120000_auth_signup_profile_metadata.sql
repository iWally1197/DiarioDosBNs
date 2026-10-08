-- Amplia o cadastro sem recriar tabelas nem alterar contas que já existem.
-- A função é chamada pelo gatilho já instalado em auth.users.
begin;

alter table public.profiles
  add column if not exists age_range text,
  add column if not exists education_level text,
  add column if not exists education_detail text,
  add column if not exists teacher_degree_level text,
  add column if not exists teacher_degree_program text,
  add column if not exists teacher_institution text;

create or replace function public.handle_auth_user_created()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_requested text;
  v_role public.account_role;
  v_status public.account_status;
  v_age text;
  v_education text;
  v_degree text;
begin
  if new.raw_user_meta_data->>'terms_version' is distinct from '1.0'
     or new.raw_user_meta_data->>'privacy_version' is distinct from '1.0' then
    raise exception 'Aceite vigente dos termos e da política é obrigatório.';
  end if;

  v_requested := new.raw_user_meta_data->>'requested_role';
  if v_requested is null or v_requested not in ('aluno','professor') then
    raise exception 'Escolha aluno ou professor para criar a conta.';
  end if;

  if nullif(trim(coalesce(new.raw_user_meta_data->>'display_name','')),'') is null then
    raise exception 'Informe seu nome para criar a conta.';
  end if;

  if v_requested='professor' then
    if new.raw_user_meta_data->>'teacher_verification_ack' is distinct from 'true' then
      raise exception 'Confirme que a conta de professor precisa de aprovação.';
    end if;
    v_role := 'professor';
    v_status := 'pending';
  else
    v_role := 'aluno';
    v_status := 'active';
  end if;

  v_age := case when new.raw_user_meta_data->>'age_range' in
    ('Até 12 anos','13 a 15 anos','16 a 17 anos','18 a 24 anos','25 a 39 anos','40 anos ou mais')
    then new.raw_user_meta_data->>'age_range' else null end;
  v_education := case when new.raw_user_meta_data->>'education_level' in
    ('Ensino Fundamental I','Ensino Fundamental II','Ensino Médio','Ensino Técnico','Ensino Superior','Pós-graduação','Outro')
    then new.raw_user_meta_data->>'education_level' else null end;
  v_degree := case when new.raw_user_meta_data->>'teacher_degree_level' in
    ('Bacharelado','Licenciatura','Tecnólogo','Especialização','Mestrado acadêmico','Mestrado profissional','Doutorado acadêmico','Doutorado profissional','Ainda cursando graduação','Outro')
    then new.raw_user_meta_data->>'teacher_degree_level' else null end;

  if v_age is null then raise exception 'Selecione sua faixa etária.'; end if;
  if v_requested='aluno' and v_education is null then raise exception 'Selecione sua etapa de ensino.'; end if;
  if v_requested='professor' and (v_degree is null or nullif(trim(coalesce(new.raw_user_meta_data->>'teacher_degree_program','')),'') is null) then
    raise exception 'Informe sua formação docente.';
  end if;

  insert into public.profiles(
    id, display_name, terms_version, privacy_version, age_range,
    education_level, education_detail, teacher_degree_level,
    teacher_degree_program, teacher_institution
  ) values (
    new.id,
    left(coalesce(new.raw_user_meta_data->>'display_name',''),100),
    '1.0',
    '1.0',
    v_age,
    v_education,
    nullif(left(coalesce(new.raw_user_meta_data->>'education_detail',''),100),''),
    v_degree,
    nullif(left(coalesce(new.raw_user_meta_data->>'teacher_degree_program',''),160),''),
    nullif(left(coalesce(new.raw_user_meta_data->>'teacher_institution',''),160),'')
  );

  insert into public.user_roles(user_id,role,status)
  values(new.id,v_role,v_status);
  return new;
end;
$$;

commit;
