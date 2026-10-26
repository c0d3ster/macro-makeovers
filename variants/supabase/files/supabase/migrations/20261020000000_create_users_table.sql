-- App-level profile for each Supabase Auth user (auth.users holds credentials and sessions)

create type public.user_role as enum ('client', 'developer', 'admin', 'super_admin');

create table public.users (
  id uuid primary key default gen_random_uuid(),
  auth_id uuid not null unique references auth.users (id) on delete cascade,
  email varchar(255) not null unique,
  first_name varchar(100),
  last_name varchar(100),
  avatar_url text,
  role public.user_role not null default 'client',
  created_at timestamp not null default now(),
  updated_at timestamp not null default now()
);

-- Create the profile row as part of signup (replaces the Clerk user.created webhook).
-- Google sends given_name/family_name/picture; email signups have no metadata, so those stay null.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.users (auth_id, email, first_name, last_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'first_name', new.raw_user_meta_data ->> 'given_name'),
    coalesce(new.raw_user_meta_data ->> 'last_name', new.raw_user_meta_data ->> 'family_name'),
    coalesce(new.raw_user_meta_data ->> 'avatar_url', new.raw_user_meta_data ->> 'picture')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Users can read their own row through the Supabase API and Realtime.
-- No write policies on purpose: writes go through GraphQL (Drizzle connects as postgres and
-- bypasses RLS), so users cannot change their own role.
alter table public.users enable row level security;

create policy "Users can read their own row"
  on public.users
  for select
  to authenticated
  using ((select auth.uid()) = auth_id);
