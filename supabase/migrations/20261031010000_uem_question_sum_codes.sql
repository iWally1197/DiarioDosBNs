alter table public.physics_questions
  drop constraint if exists physics_questions_correct_option_check;

alter table public.physics_questions
  add constraint physics_questions_correct_option_check
  check (
    correct_option is null
    or correct_option = any (array['A','B','C','D','E']::text[])
    or correct_option ~ '^(0[0-9]|[12][0-9]|3[01])$'
  );

create or replace function public.physics_question_choices_valid(
  p_choices jsonb,
  p_correct_option text,
  p_is_published boolean
)
returns boolean
language sql
immutable
set search_path to ''
as $function$
  select coalesce(
    jsonb_typeof(p_choices) = 'array'
    and jsonb_array_length(p_choices) <= 5
    and not exists (
      select 1
      from jsonb_array_elements(p_choices) as option_item(value)
      where jsonb_typeof(option_item.value) <> 'object'
        or not (
          option_item.value ->> 'letter' in ('A', 'B', 'C', 'D', 'E')
          or option_item.value ->> 'letter' in ('01', '02', '04', '08', '16')
        )
        or nullif(btrim(option_item.value ->> 'text'), '') is null
    )
    and (
      select count(*) = count(distinct option_item.value ->> 'letter')
      from jsonb_array_elements(p_choices) as option_item(value)
    )
    and (
      p_correct_option is null
      or (
        p_correct_option in ('A', 'B', 'C', 'D', 'E')
        and not exists (
          select 1
          from jsonb_array_elements(p_choices) as option_item(value)
          where option_item.value ->> 'letter' not in ('A', 'B', 'C', 'D', 'E')
        )
        and exists (
          select 1
          from jsonb_array_elements(p_choices) as option_item(value)
          where option_item.value ->> 'letter' = p_correct_option
        )
      )
      or (
        p_correct_option ~ '^(0[0-9]|[12][0-9]|3[01])$'
        and jsonb_array_length(p_choices) = 5
        and not exists (
          select 1
          from jsonb_array_elements(p_choices) as option_item(value)
          where option_item.value ->> 'letter' not in ('01', '02', '04', '08', '16')
        )
      )
    )
    and (
      not p_is_published
      or jsonb_array_length(p_choices) >= 2 and p_correct_option is not null
    ),
    false
  );
$function$;
