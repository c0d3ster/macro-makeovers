begin;
select plan(15);

-- Fixtures (inserted as the postgres superuser, which bypasses RLS)
insert into public.recipes (id, slug, title, summary, servings, prep_minutes, cook_minutes, cost_tier, difficulty, status)
values
  ('00000000-0000-0000-0000-0000000000a1', 'published-one', 'Published One', 'Visible to everyone', 4, 10, 20, 1, 1, 'published'),
  ('00000000-0000-0000-0000-0000000000a2', 'draft-one', 'Draft One', 'Owner only', 4, 10, 20, 1, 1, 'draft');

insert into public.ingredients (recipe_id, position, raw_text) values
  ('00000000-0000-0000-0000-0000000000a1', 1, '1 lb chicken'),
  ('00000000-0000-0000-0000-0000000000a2', 1, '2 cups rice');

insert into public.recipe_revisions (recipe_id, snapshot)
values ('00000000-0000-0000-0000-0000000000a1', '{}'::jsonb);

insert into auth.users (id, instance_id, aud, role, email)
values
  ('00000000-0000-0000-0000-0000000000b1', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'pgtap-owner@test.invalid'),
  ('00000000-0000-0000-0000-0000000000b2', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'pgtap-member@test.invalid');

-- handle_new_user created both profile rows; promote one to owner
update public.users set role = 'super_admin' where email = 'pgtap-owner@test.invalid';

-- Anonymous visitor
set local role anon;

-- Counts look only at this file's fixtures, so recipes already in the database do not matter
select is((select count(*)::int from public.recipes where slug in ('published-one', 'draft-one')), 1, 'anon sees only published recipes');
select is((select count(*)::int from public.ingredients where recipe_id in ('00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000a2')), 1, 'anon sees ingredients of published recipes only');
select is((select count(*)::int from public.tags where name in ('pasta', 'chili', 'air fryer')), 3, 'anon can read seeded tags');
select throws_ok(
  $$select 1 from public.recipe_revisions$$,
  '42501',
  null,
  'anon cannot read revisions'
);

select throws_ok(
  $$insert into public.recipes (slug, title, summary, servings, prep_minutes, cook_minutes, cost_tier, difficulty)
    values ('anon-write', 'x', 'x', 1, 1, 1, 1, 1)$$,
  '42501',
  null,
  'anon cannot insert recipes'
);

select throws_ok(
  $$update public.recipes set title = 'Changed' where id = '00000000-0000-0000-0000-0000000000a1'$$,
  '42501',
  null,
  'anon cannot update recipes'
);

-- Signed-in member who is not an owner
reset role;
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000b2","role":"authenticated"}', true);

select is((select count(*)::int from public.recipes where slug in ('published-one', 'draft-one')), 1, 'member sees only published recipes');
select is((select public.is_owner()), false, 'member is not an owner');
select throws_ok(
  $$insert into public.recipes (slug, title, summary, servings, prep_minutes, cook_minutes, cost_tier, difficulty)
    values ('member-write', 'x', 'x', 1, 1, 1, 1, 1)$$,
  '42501',
  null,
  'member cannot insert recipes'
);

-- Owner
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000b1","role":"authenticated"}', true);

select is((select public.is_owner()), true, 'owner is recognised');
select is((select count(*)::int from public.recipes where slug in ('published-one', 'draft-one')), 2, 'owner sees drafts too');
select is((select count(*)::int from public.recipe_revisions where recipe_id = '00000000-0000-0000-0000-0000000000a1'), 1, 'owner can read revisions');

select lives_ok(
  $$insert into public.recipes (slug, title, summary, servings, prep_minutes, cook_minutes, cost_tier, difficulty)
    values ('owner-write', 'Owner Write', 'ok', 2, 5, 5, 2, 2)$$,
  'owner can insert recipes'
);

select lives_ok(
  $$insert into public.steps (recipe_id, phase, position, body_md, duration_minutes)
    values ('00000000-0000-0000-0000-0000000000a1', 'cook', 1, 'Stir', 0.25)$$,
  'step durations can be a fraction of a minute'
);

select throws_ok(
  $$insert into public.recipes (slug, title, summary, servings, prep_minutes, cook_minutes, cost_tier, difficulty)
    values ('bad-cost', 'x', 'x', 1, 1, 1, 9, 1)$$,
  '23514',
  null,
  'cost tier above 4 is rejected'
);

select * from finish();
rollback;
