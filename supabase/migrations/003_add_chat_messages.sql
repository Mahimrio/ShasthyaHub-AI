-- 003: chat_messages for the Shasthya Bondhu chatbot
-- Run in Supabase SQL editor after 001/002.

create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  lang text not null default 'bn' check (lang in ('bn', 'en')),
  created_at timestamptz not null default now()
);

alter table public.chat_messages enable row level security;

create policy "chat_select_own" on public.chat_messages
  for select using (auth.uid() = user_id);

create policy "chat_insert_own" on public.chat_messages
  for insert with check (auth.uid() = user_id);

create policy "chat_delete_own" on public.chat_messages
  for delete using (auth.uid() = user_id);

create index if not exists idx_chat_messages_user_created
  on public.chat_messages (user_id, created_at desc);
