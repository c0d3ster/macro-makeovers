-- PRD 07 launch: where each user came from, and the email list.

-- Traffic source at sign-up: UTM tags first, then the referring site. Null on users who signed
-- up before this was recorded.
alter table public.users
  add column signup_source varchar(255),
  add column signup_medium varchar(255),
  add column signup_campaign varchar(255),
  add column signup_referrer varchar(255),
  add column signup_landing_path varchar(255);

-- Email sign-ups pass the source as user metadata, so the profile row starts with it. Google
-- sign-ups have no metadata; the auth callback fills those in.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.users (
    auth_id, email, first_name, last_name, avatar_url,
    signup_source, signup_medium, signup_campaign, signup_referrer, signup_landing_path
  )
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'first_name', new.raw_user_meta_data ->> 'given_name'),
    coalesce(new.raw_user_meta_data ->> 'last_name', new.raw_user_meta_data ->> 'family_name'),
    coalesce(new.raw_user_meta_data ->> 'avatar_url', new.raw_user_meta_data ->> 'picture'),
    -- Visitor-supplied, so clipped to the column width instead of failing the sign-up
    left(new.raw_user_meta_data ->> 'signup_source', 255),
    left(new.raw_user_meta_data ->> 'signup_medium', 255),
    left(new.raw_user_meta_data ->> 'signup_campaign', 255),
    left(new.raw_user_meta_data ->> 'signup_referrer', 255),
    left(new.raw_user_meta_data ->> 'signup_landing_path', 255)
  );
  return new;
end;
$$;

-- The email list. Double opt-in: a row starts pending and only gets mail once confirmed.
create type public.email_subscriber_status as enum ('pending', 'confirmed', 'unsubscribed');

create table public.email_subscribers (
  id uuid primary key default gen_random_uuid(),
  -- Stored lowercased, so one address is one row
  email varchar(255) not null unique check (email = lower(email)),
  status public.email_subscriber_status not null default 'pending',
  -- Random and secret: confirms the address and unsubscribes it from any email's link
  token varchar(64) not null unique,
  -- Where the form was, like '/recipes/smash-burgers', and the visitor's traffic source
  signup_path varchar(255),
  signup_source varchar(255),
  signup_medium varchar(255),
  signup_campaign varchar(255),
  -- Set when the address belongs to a signed-in user
  user_id uuid references public.users (id) on delete set null,
  -- Last confirmation email, so repeat submissions cannot flood an inbox
  confirmation_sent_at timestamp,
  confirmed_at timestamp,
  unsubscribed_at timestamp,
  created_at timestamp not null default now(),
  updated_at timestamp not null default now()
);

create index email_subscribers_status_idx on public.email_subscribers (status);

create trigger email_subscribers_set_updated_at
  before update on public.email_subscribers
  for each row execute function public.set_updated_at();

-- No policies on purpose: addresses and tokens are private. Writes go through GraphQL, where
-- Drizzle connects as postgres and bypasses RLS.
alter table public.email_subscribers enable row level security;
revoke all on public.email_subscribers from anon, authenticated;
