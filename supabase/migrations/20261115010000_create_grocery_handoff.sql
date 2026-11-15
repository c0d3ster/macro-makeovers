-- Grocery handoff (PRD 05): the member's remembered grocer and store, and a log of handoffs for
-- metrics. Writes go through GraphQL (Drizzle bypasses RLS). Members can read their own rows.

create table public.member_grocer (
  user_id uuid primary key references public.users (id) on delete cascade,
  grocer text not null check (grocer in ('kroger', 'walmart', 'instacart')),
  store_id text,
  store_name text,
  zip text check (zip ~ '^[0-9]{5}$'),
  updated_at timestamp not null default now()
);

alter table public.member_grocer enable row level security;

create policy "Members can read their own grocer"
  on public.member_grocer
  for select
  to authenticated
  using (
    user_id in (select id from public.users where auth_id = (select auth.uid()))
  );

-- One row per send. No item names or store ids, only counts, so the log says how the handoff
-- did per grocer without keeping anyone's shopping.
create table public.cart_handoffs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users (id) on delete set null,
  grocer text not null check (grocer in ('kroger', 'walmart', 'instacart')),
  outcome text not null check (outcome in ('sent', 'failed')),
  -- The error code for a failed send, like GROCER_AUTH_REQUIRED
  error_code text,
  item_count integer not null check (item_count >= 0),
  unmatched_count integer not null check (unmatched_count >= 0),
  created_at timestamp not null default now()
);

create index cart_handoffs_grocer_idx on public.cart_handoffs (grocer, created_at);

-- Metrics only: no policies, so only the server connection reads it
alter table public.cart_handoffs enable row level security;
