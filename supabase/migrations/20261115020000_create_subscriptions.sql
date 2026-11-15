-- Paid access (PRD 01). One row per user per entitlement source. Stripe is the only source today;
-- a partner (ForgeFit) grant later is another row with source 'partner', not a special case.
-- Rows are written by the Stripe webhook over the server connection, never by users.

create type public.subscription_source as enum ('stripe', 'partner');

-- Mirrors Stripe's subscription statuses, so partner grants use the same vocabulary
create type public.subscription_status as enum (
  'incomplete',
  'incomplete_expired',
  'trialing',
  'active',
  'past_due',
  'canceled',
  'unpaid',
  'paused'
);

create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  source public.subscription_source not null default 'stripe',
  -- Set when checkout starts, before a subscription exists
  stripe_customer_id text unique,
  stripe_subscription_id text unique,
  status public.subscription_status not null,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  -- When the row last went past_due (a renewal charge failed). Starts the grace window. Stripe
  -- advances the period when it bills, so the period end cannot mark the start of the grace.
  past_due_since timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, source),
  constraint stripe_rows_have_a_customer
    check (source <> 'stripe' or stripe_customer_id is not null)
);

create trigger subscriptions_set_updated_at
  before update on public.subscriptions
  for each row execute function public.set_updated_at();

-- Stripe events already handled. The webhook records the event id in the same transaction as
-- its writes, so a redelivered event changes nothing.
create table public.stripe_events (
  id text primary key,
  type text not null,
  processed_at timestamptz not null default now()
);

-- Paid access for the signed-in user, for RLS policies on paid tables (meal plans, orders).
-- Keep in step with hasPaidAccess in src/libs/billing/paidAccess.ts: owners always; active or
-- trialing until 3 days past the period end (a late renewal webhook does not cut anyone off), or
-- with no period end (an open partner grant); past_due for 3 days after the charge failed.
create function public.has_paid_access()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select public.is_owner()) or exists (
    select 1
    from public.subscriptions s
    join public.users u on u.id = s.user_id
    where u.auth_id = (select auth.uid())
      and (
        (s.status in ('active', 'trialing')
          and (s.current_period_end is null or s.current_period_end + interval '3 days' > now()))
        or (s.status = 'past_due'
          and s.past_due_since is not null
          and s.past_due_since + interval '3 days' > now())
      )
  );
$$;

-- Users read their own rows, owners read all (to see who is subscribed). No write policies:
-- writes come from the webhook through the server connection.
alter table public.subscriptions enable row level security;

create policy "Users read their own subscriptions, owners read all"
  on public.subscriptions
  for select
  to authenticated
  using (
    (select public.is_owner())
    or user_id in (select id from public.users where auth_id = (select auth.uid()))
  );

-- No policies: only the server connection reads or writes it
alter table public.stripe_events enable row level security;
