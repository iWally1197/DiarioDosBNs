begin;

create or replace function public.physics_question_choices_valid(
  p_choices jsonb,
  p_correct_option text,
  p_is_published boolean
)
returns boolean
language sql
immutable
set search_path = ''
as $function$
  select coalesce(
    jsonb_typeof(p_choices) = 'array'
    and jsonb_array_length(p_choices) <= 5
    and not exists (
      select 1
      from jsonb_array_elements(p_choices) as option_item(value)
      where jsonb_typeof(option_item.value) <> 'object'
        or option_item.value ->> 'letter' not in ('A', 'B', 'C', 'D', 'E')
        or nullif(btrim(option_item.value ->> 'text'), '') is null
    )
    and (
      select count(*) = count(distinct option_item.value ->> 'letter')
      from jsonb_array_elements(p_choices) as option_item(value)
    )
    and (
      p_correct_option is null
      or p_correct_option in ('A', 'B', 'C', 'D', 'E')
        and exists (
          select 1
          from jsonb_array_elements(p_choices) as option_item(value)
          where option_item.value ->> 'letter' = p_correct_option
        )
    )
    and (
      not p_is_published
      or jsonb_array_length(p_choices) >= 2 and p_correct_option is not null
    ),
    false
  );
$function$;

create table if not exists public.physics_questions (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(btrim(title)) between 1 and 180),
  display_format text not null default 'typed' check (display_format in ('typed', 'image')),
  statement text not null default '' check (char_length(statement) <= 20000),
  cover_image_path text,
  illustration_image_paths text[] not null default '{}'::text[] check (cardinality(illustration_image_paths) <= 8),
  choices jsonb not null default '[]'::jsonb,
  correct_option text check (correct_option is null or correct_option in ('A', 'B', 'C', 'D', 'E')),
  resolution text not null default '' check (char_length(resolution) <= 20000),
  discipline text not null default 'Física' check (char_length(btrim(discipline)) between 1 and 100),
  subject text not null default '' check (char_length(subject) <= 120),
  difficulty text not null default 'Média' check (difficulty in ('Fácil', 'Média', 'Difícil')),
  bank text not null default '' check (char_length(bank) <= 100),
  institution text not null default '' check (char_length(institution) <= 140),
  year smallint check (year is null or year between 1900 and 2100),
  status text not null default 'draft' check (status in ('draft', 'published')),
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  published_at timestamptz,
  constraint physics_questions_choices_valid check (
    public.physics_question_choices_valid(choices, correct_option, status = 'published')
  ),
  constraint physics_questions_published_content_valid check (
    status <> 'published'
    or (
      (display_format = 'image' and nullif(btrim(cover_image_path), '') is not null)
      or (display_format = 'typed' and nullif(btrim(statement), '') is not null)
    )
  )
);

create index if not exists physics_questions_published_created_idx
  on public.physics_questions (created_at desc)
  where status = 'published';
create index if not exists physics_questions_subject_idx
  on public.physics_questions (subject, discipline, difficulty);

alter table public.physics_questions enable row level security;

drop policy if exists physics_questions_read_published_or_admin on public.physics_questions;
create policy physics_questions_read_published_or_admin
  on public.physics_questions for select to anon, authenticated
  using (status = 'published' or public.is_admin());

drop policy if exists physics_questions_admin_manage on public.physics_questions;
create policy physics_questions_admin_manage
  on public.physics_questions for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

grant select on public.physics_questions to anon, authenticated;
grant insert, update, delete on public.physics_questions to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'question-images',
  'question-images',
  true,
  8388608,
  array['image/png', 'image/jpeg', 'image/webp']::text[]
)
on conflict (id) do update
set name = excluded.name,
    public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists question_images_admin_upload on storage.objects;
create policy question_images_admin_upload
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'question-images'
    and public.is_admin()
    and (storage.foldername(name))[1] = 'questions'
    and storage.extension(name) in ('png', 'jpg', 'jpeg', 'webp')
  );

drop policy if exists question_images_admin_delete on storage.objects;
create policy question_images_admin_delete
  on storage.objects for delete to authenticated
  using (bucket_id = 'question-images' and public.is_admin());

commit;
