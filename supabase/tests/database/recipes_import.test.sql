begin;
select plan(14);

-- A minimal payload in the shape the app sends
create temp table payload (body jsonb) on commit drop;
grant all on payload to service_role, anon, authenticated;

insert into payload values ($json$
{
  "slug": "test-chili",
  "title": "Test Chili",
  "summary": "A test recipe",
  "servings": 4,
  "prepMinutes": 10,
  "cookMinutes": 40,
  "costTier": 2,
  "difficulty": 2,
  "tags": ["brand new tag", "chili"],
  "nutrition": [
    {"kind": "makeover", "label": "Base only", "isDefault": false, "calories": 370, "carbsG": 42, "fatG": 8, "proteinG": 32},
    {"kind": "makeover", "label": "Fully loaded", "isDefault": true, "calories": 500, "carbsG": 52, "fatG": 15, "proteinG": 39},
    {"kind": "traditional", "label": "Traditional", "isDefault": false, "calories": 480, "carbsG": 30, "fatG": 28, "proteinG": 27}
  ],
  "ingredients": [
    {"raw": "1 lb ground turkey", "quantity": 1, "unit": "lb", "name": "ground turkey"},
    {"group": "Umami", "raw": "2 tbsp soy sauce"}
  ],
  "steps": [
    {"phase": "prep", "body": "Dice the onion"},
    {"phase": "cook", "body": "Stir for 15 seconds", "durationMinutes": 0.25}
  ],
  "notes": [
    {"kind": "make_or_break", "body": "Simmer long enough"},
    {"kind": "fixes", "body": "Too thin: reduce"}
  ]
}
$json$::jsonb);

-- Only the service role can import
set local role anon;
select throws_ok(
  $$select public.import_recipe((select body from payload))$$,
  '42501',
  null,
  'anon cannot call import_recipe'
);

reset role;
set local role authenticated;
select throws_ok(
  $$select public.import_recipe((select body from payload))$$,
  '42501',
  null,
  'signed-in users cannot call import_recipe'
);

reset role;
set local role service_role;

-- First import creates a draft with every child row
select lives_ok(
  $$select public.import_recipe((select body from payload))$$,
  'service role can import a recipe'
);

select is(
  (select status::text from public.recipes where slug = 'test-chili'),
  'draft',
  'a new slug lands as a draft'
);

select is(
  (select count(*)::int from public.recipe_nutrition n join public.recipes r on r.id = n.recipe_id where r.slug = 'test-chili'),
  3,
  'nutrition variants are stored'
);

select is(
  (select label from public.recipe_nutrition n join public.recipes r on r.id = n.recipe_id
   where r.slug = 'test-chili' and n.is_default),
  'Fully loaded',
  'the default variant is flagged'
);

select is(
  (select duration_minutes from public.steps s join public.recipes r on r.id = s.recipe_id
   where r.slug = 'test-chili' and s.phase = 'cook'),
  0.25,
  'fractional step durations are stored'
);

select is(
  (select kind::text from public.tags where name = 'brand new tag'),
  'attribute',
  'unknown tags are created as attribute tags'
);

select is(
  (select count(*)::int from public.recipe_revisions rv join public.recipes r on r.id = rv.recipe_id where r.slug = 'test-chili'),
  1,
  'an import writes a revision'
);

-- The snapshot has the same shape as the payload
select is(
  public.recipe_snapshot((select id from public.recipes where slug = 'test-chili')),
  (select body from payload),
  'the snapshot round-trips the import payload'
);

-- Re-importing replaces children and keeps the published status
update public.recipes set status = 'published' where slug = 'test-chili';

update payload set body = jsonb_set(
  jsonb_set(body, '{title}', '"Test Chili v2"'),
  '{ingredients}', '[{"raw": "2 lb ground turkey"}]'
);

select lives_ok(
  $$select public.import_recipe((select body from payload))$$,
  're-importing an existing slug works'
);

select is(
  (select status::text from public.recipes where slug = 'test-chili'),
  'published',
  'a re-import does not unpublish a recipe'
);

select is(
  (select count(*)::int from public.ingredients i join public.recipes r on r.id = i.recipe_id where r.slug = 'test-chili'),
  1,
  'a re-import replaces the old ingredients'
);

select is(
  (select count(*)::int from public.recipe_revisions rv join public.recipes r on r.id = rv.recipe_id where r.slug = 'test-chili'),
  2,
  'each import adds a revision'
);

select * from finish();
rollback;
