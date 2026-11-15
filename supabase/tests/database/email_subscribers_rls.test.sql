begin;
select plan(5);

-- Fixtures (inserted as the postgres superuser, which bypasses RLS)
insert into public.email_subscribers (email, token)
values ('pgtap-subscriber@test.invalid', 'pgtap-token');

insert into auth.users (id, instance_id, aud, role, email, raw_user_meta_data)
values (
  '00000000-0000-0000-0000-0000000000c1',
  '00000000-0000-0000-0000-000000000000',
  'authenticated',
  'authenticated',
  'pgtap-signup@test.invalid',
  '{"signup_source": "reddit", "signup_medium": "social", "signup_landing_path": "/recipes/x"}'::jsonb
);

select is(
  (select signup_source || '/' || signup_medium || '/' || signup_landing_path
   from public.users where email = 'pgtap-signup@test.invalid'),
  'reddit/social//recipes/x',
  'handle_new_user stores the sign-up traffic source'
);

set local role anon;

select throws_ok(
  $$select 1 from public.email_subscribers$$,
  '42501',
  null,
  'anon cannot read subscribers'
);
select throws_ok(
  $$insert into public.email_subscribers (email, token) values ('x@test.invalid', 't')$$,
  '42501',
  null,
  'anon cannot add subscribers directly'
);

reset role;
set local role authenticated;
select set_config('request.jwt.claims', '{"sub": "00000000-0000-0000-0000-0000000000c1"}', true);

select throws_ok(
  $$select 1 from public.email_subscribers$$,
  '42501',
  null,
  'signed-in users cannot read subscribers'
);
select throws_ok(
  $$update public.email_subscribers set status = 'confirmed'$$,
  '42501',
  null,
  'signed-in users cannot confirm addresses directly'
);

select * from finish();
rollback;
