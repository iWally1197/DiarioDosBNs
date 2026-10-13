begin;

create table if not exists public.physics_ai_conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null default 'Nova conversa' check (char_length(title) between 1 and 120),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, user_id)
);

create table if not exists public.physics_ai_messages (
  id bigint generated always as identity primary key,
  conversation_id uuid not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null check (char_length(content) between 1 and 5000),
  created_at timestamptz not null default now(),
  constraint physics_ai_messages_owner_fk
    foreign key (conversation_id, user_id)
    references public.physics_ai_conversations(id, user_id)
    on delete cascade
);

create index if not exists physics_ai_conversations_owner_updated_idx
  on public.physics_ai_conversations(user_id, updated_at desc);
create index if not exists physics_ai_messages_conversation_created_idx
  on public.physics_ai_messages(conversation_id, created_at);

alter table public.physics_ai_conversations enable row level security;
alter table public.physics_ai_messages enable row level security;

drop policy if exists "Users can read their AI conversations" on public.physics_ai_conversations;
create policy "Users can read their AI conversations"
  on public.physics_ai_conversations for select to authenticated
  using (user_id = (select auth.uid()));

drop policy if exists "Users can create their AI conversations" on public.physics_ai_conversations;
create policy "Users can create their AI conversations"
  on public.physics_ai_conversations for insert to authenticated
  with check (user_id = (select auth.uid()));

drop policy if exists "Users can update their AI conversations" on public.physics_ai_conversations;
create policy "Users can update their AI conversations"
  on public.physics_ai_conversations for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

drop policy if exists "Users can delete their AI conversations" on public.physics_ai_conversations;
create policy "Users can delete their AI conversations"
  on public.physics_ai_conversations for delete to authenticated
  using (user_id = (select auth.uid()));

drop policy if exists "Users can read their AI messages" on public.physics_ai_messages;
create policy "Users can read their AI messages"
  on public.physics_ai_messages for select to authenticated
  using (user_id = (select auth.uid()));

drop policy if exists "Users can create their AI messages" on public.physics_ai_messages;
create policy "Users can create their AI messages"
  on public.physics_ai_messages for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and exists (
      select 1
      from public.physics_ai_conversations c
      where c.id = conversation_id
        and c.user_id = (select auth.uid())
    )
  );

drop policy if exists "Users can delete their AI messages" on public.physics_ai_messages;
create policy "Users can delete their AI messages"
  on public.physics_ai_messages for delete to authenticated
  using (user_id = (select auth.uid()));

grant select, insert, update, delete on public.physics_ai_conversations to authenticated;
grant select, insert, delete on public.physics_ai_messages to authenticated;
grant usage, select on sequence public.physics_ai_messages_id_seq to authenticated;

create table if not exists public.physics_ai_request_limits (
  user_id uuid primary key references auth.users(id) on delete cascade,
  window_started_at timestamptz not null,
  request_count integer not null check (request_count >= 0)
);
alter table public.physics_ai_request_limits enable row level security;
revoke all on public.physics_ai_request_limits from public, anon, authenticated;

create or replace function public.consume_physics_ai_request()
returns boolean
language plpgsql
security definer
set search_path = ''
as $function$
declare
  current_user_id uuid := auth.uid();
  current_count integer;
begin
  if current_user_id is null then
    return false;
  end if;

  insert into public.physics_ai_request_limits as limits
    (user_id, window_started_at, request_count)
  values (current_user_id, clock_timestamp(), 1)
  on conflict (user_id) do update
    set window_started_at = case
          when limits.window_started_at <= clock_timestamp() - interval '1 minute'
            then clock_timestamp()
          else limits.window_started_at
        end,
        request_count = case
          when limits.window_started_at <= clock_timestamp() - interval '1 minute'
            then 1
          else limits.request_count + 1
        end
  returning request_count into current_count;

  return current_count <= 12;
end;
$function$;

revoke all on function public.consume_physics_ai_request() from public, anon;
grant execute on function public.consume_physics_ai_request() to authenticated;

commit;
