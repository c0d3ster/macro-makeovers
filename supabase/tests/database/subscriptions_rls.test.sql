begin;
select plan(14);

-- Fixtures (inserted as the postgres superuser, which bypasses RLS)
insert into auth.users (id, instance_id, aud, role, email)
values
  ('00000000-0000-0000-0000-0000000000c1', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'pgtap-sub-owner@test.invalid'),
  ('00000000-0000-0000-0000-0000000000c2', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'pgtap-sub-paid@test.invalid'),
  ('00000000-0000-0000-0000-0000000000c3', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'pgtap-sub-lapsed@test.invalid'),
  ('00000000-0000-0000-0000-0000000000c4', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'pgtap-sub-grace@test.invalid'),
  ('00000000-0000-0000-0000-0000000000c5', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'pgtap-sub-overdue@test.invalid'),
  ('00000000-0000-0000-0000-0000000000c6', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'pgtap-sub-partner@test.invalid'),
  ('00000000-0000-0000-0000-0000000000c7', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'pgtap-sub-free@test.invalid');

update public.users set role = 'super_admin' where email = 'pgtap-sub-owner@test.invalid';

insert into public.subscriptions (user_id, source, stripe_customer_id, stripe_subscription_id, status, current_period_end, past_due_since)
select id, 'stripe', 'cus_paid', 'sub_paid', 'active', now() + interval '20 days', null
  from public.users where email = 'pgtap-sub-paid@test.invalid'
union all
select id, 'stripe', 'cus_lapsed', 'sub_lapsed', 'canceled', now() - interval '10 days', null
  from public.users where email = 'pgtap-sub-lapsed@test.invalid'
union all
select id, 'stripe', 'cus_grace', 'sub_grace', 'past_due', now() + interval '28 days', now() - interval '1 day'
  from public.users where email = 'pgtap-sub-grace@test.invalid'
union all
select id, 'stripe', 'cus_overdue', 'sub_overdue', 'past_due', now() + interval '20 days', now() - interval '5 days'
  from public.users where email = 'pgtap-sub-overdue@test.invalid'
union all
select id, 'partner', null, null, 'active', null, null
  from public.users where email = 'pgtap-sub-partner@test.invalid';

select throws_ok(
  $$insert into public.subscriptions (user_id, source, status)
    select id, 'stripe', 'active' from public.users where email = 'pgtap-sub-free@test.invalid'$$,
  '23514',
  null,
  'a Stripe row needs a customer id'
);

-- Anonymous visitor
set local role anon;

select throws_ok($$select 1 from public.subscriptions$$, '42501', null, 'anon cannot read subscriptions');
select is((select public.has_paid_access()), false, 'anon has no paid access');

reset role;
set local role authenticated;

-- Paying member
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000c2","role":"authenticated"}', true);
select is((select count(*)::int from public.subscriptions), 1, 'a member sees only their own row');
select is((select public.has_paid_access()), true, 'active subscription has paid access');
select throws_ok(
  $$insert into public.subscriptions (user_id, source, status)
    select id, 'partner', 'active' from public.users where email = 'pgtap-sub-free@test.invalid'$$,
  '42501',
  null,
  'a member cannot write subscriptions'
);
select is(
  (select count(*)::int from public.stripe_events),
  0,
  'a member sees no Stripe events'
);

-- Lapsed, past due within and beyond the grace window, partner, free
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000c3","role":"authenticated"}', true);
select is((select public.has_paid_access()), false, 'canceled subscription has no paid access');

select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000c4","role":"authenticated"}', true);
select is((select public.has_paid_access()), true, 'past due inside the grace window keeps access');

select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000c5","role":"authenticated"}', true);
select is((select public.has_paid_access()), false, 'past due beyond the grace window loses access');

select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000c6","role":"authenticated"}', true);
select is((select public.has_paid_access()), true, 'an open partner grant has paid access');

select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000c7","role":"authenticated"}', true);
select is((select public.has_paid_access()), false, 'a free member has no paid access');

-- Owner
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000c1","role":"authenticated"}', true);
select is((select public.has_paid_access()), true, 'the owner always has paid access');
select is(
  (select count(*)::int from public.subscriptions where stripe_customer_id like 'cus_%' or source = 'partner'),
  5,
  'the owner sees every subscription'
);

select * from finish();
rollback;
