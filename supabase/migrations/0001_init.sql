-- Molly 백엔드 초기 스키마 (profiles / conversations / messages)
-- 인증은 Supabase Auth(auth.users). 모든 테이블은 RLS로 유저별 격리.

create table if not exists profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  locale       text default 'ko',
  created_at   timestamptz not null default now()
);

create table if not exists conversations (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  started_at timestamptz not null default now(),
  ended_at   timestamptz
);

create table if not exists messages (
  id              uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references conversations(id) on delete cascade,
  role            text not null check (role in ('user','assistant')),
  content         text not null,
  created_at      timestamptz not null default now()
);

create index if not exists idx_conversations_user on conversations(user_id, started_at desc);
create index if not exists idx_messages_conv on messages(conversation_id, created_at);

-- RLS: 본인 데이터만
alter table profiles      enable row level security;
alter table conversations enable row level security;
alter table messages      enable row level security;

create policy "own profile"       on profiles      for all using (id = auth.uid());
create policy "own conversations" on conversations for all using (user_id = auth.uid());
create policy "own messages"      on messages      for all using (
  conversation_id in (select id from conversations where user_id = auth.uid())
);
