-- GOLDfinch Notes V2 — Supabase database setup
-- Run this entire script in Supabase SQL Editor.
--
-- What this creates:
-- profiles: one public username per authenticated account
-- messages: saved text belonging to a user
--
-- Security:
-- Row Level Security is enabled.
-- Anyone who is signed in can read messages.
-- A user can only create/delete messages belonging to their own account.
-- The service/secret key is NOT needed in the website.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 5000),
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.messages enable row level security;

-- Create a profile automatically whenever a new Auth user is created.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  requested_username text;
begin
  requested_username := trim(coalesce(new.raw_user_meta_data ->> 'username', ''));

  if requested_username = '' then
    requested_username := 'user_' || substr(replace(new.id::text, '-', ''), 1, 10);
  end if;

  insert into public.profiles (id, username)
  values (new.id, requested_username);

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

-- Remove/recreate policies so rerunning this SQL is safe.
drop policy if exists "Authenticated users can read profiles" on public.profiles;
drop policy if exists "Users can update their own profile" on public.profiles;

drop policy if exists "Authenticated users can read messages" on public.messages;
drop policy if exists "Users can insert their own messages" on public.messages;
drop policy if exists "Users can delete their own messages" on public.messages;

create policy "Authenticated users can read profiles"
on public.profiles
for select
to authenticated
using (true);

create policy "Users can update their own profile"
on public.profiles
for update
to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

create policy "Authenticated users can read messages"
on public.messages
for select
to authenticated
using (true);

create policy "Users can insert their own messages"
on public.messages
for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "Users can delete their own messages"
on public.messages
for delete
to authenticated
using ((select auth.uid()) = user_id);

-- Least-privilege grants for the browser client.
revoke all on table public.profiles from anon;
revoke all on table public.messages from anon;

grant select on table public.profiles to authenticated;
grant update (username) on table public.profiles to authenticated;

grant select, insert, delete on table public.messages to authenticated;
