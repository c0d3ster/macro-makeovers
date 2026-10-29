-- Recipe import: an atomic upsert-by-slug and a snapshot function.
-- The snapshot has the same shape as the import payload, so it doubles as the "before" side of
-- an import diff and as the revision history, and any revision can be re-imported.

-- Nutrition rows keep the order they were imported in
alter table public.recipe_nutrition
  add column position integer not null default 0;

-- Top of the price range for recipes whose builds cost differently (ribeye vs flank bulgogi).
-- Null means the recipe has a single tier.
alter table public.recipes
  add column cost_tier_max smallint check (cost_tier_max between 1 and 4),
  add constraint recipes_cost_tier_max_above_tier check (cost_tier_max is null or cost_tier_max > cost_tier);

create function public.recipe_snapshot(p_recipe_id uuid)
returns jsonb
language sql
stable
set search_path = ''
as $$
  select jsonb_strip_nulls(jsonb_build_object(
    'slug', r.slug,
    'title', r.title,
    'summary', r.summary,
    'servings', r.servings,
    'prepMinutes', r.prep_minutes,
    'cookMinutes', r.cook_minutes,
    'costTier', r.cost_tier,
    'costTierMax', r.cost_tier_max,
    'difficulty', r.difficulty,
    'tags', coalesce((
      select jsonb_agg(t.name order by t.name)
      from public.recipe_tags rt
      join public.tags t on t.id = rt.tag_id
      where rt.recipe_id = r.id
    ), '[]'::jsonb),
    'nutrition', coalesce((
      select jsonb_agg(jsonb_build_object(
        'kind', n.kind,
        'label', n.label,
        'isDefault', n.is_default,
        'calories', n.calories,
        'carbsG', n.carbs_g,
        'fatG', n.fat_g,
        'proteinG', n.protein_g
      ) order by n.position)
      from public.recipe_nutrition n
      where n.recipe_id = r.id
    ), '[]'::jsonb),
    'ingredients', coalesce((
      select jsonb_agg(jsonb_build_object(
        'group', i.group_name,
        'raw', i.raw_text,
        'quantity', i.quantity,
        'unit', i.unit,
        'name', i.name,
        'note', i.note
      ) order by i.position)
      from public.ingredients i
      where i.recipe_id = r.id
    ), '[]'::jsonb),
    'steps', coalesce((
      select jsonb_agg(jsonb_build_object(
        'phase', s.phase,
        'body', s.body_md,
        'durationMinutes', s.duration_minutes
      ) order by s.position)
      from public.steps s
      where s.recipe_id = r.id
    ), '[]'::jsonb),
    'notes', coalesce((
      select jsonb_agg(jsonb_build_object(
        'kind', rn.kind,
        'body', rn.body_md
      ) order by rn.position)
      from public.recipe_notes rn
      where rn.recipe_id = r.id
    ), '[]'::jsonb)
  ))
  from public.recipes r
  where r.id = p_recipe_id;
$$;

-- Upserts a recipe by slug and replaces its children in one transaction.
-- A new slug lands as a draft. An existing recipe keeps its status, so re-importing a published
-- recipe does not take it offline. Unknown tags are created as attribute tags.
-- Every call writes a revision of the resulting state.
create function public.import_recipe(p_recipe jsonb)
returns uuid
language plpgsql
set search_path = ''
as $$
declare
  v_id uuid;
begin
  insert into public.recipes (
    slug, title, summary, servings, prep_minutes, cook_minutes, cost_tier, cost_tier_max, difficulty
  )
  values (
    p_recipe ->> 'slug',
    p_recipe ->> 'title',
    p_recipe ->> 'summary',
    (p_recipe ->> 'servings')::integer,
    (p_recipe ->> 'prepMinutes')::integer,
    (p_recipe ->> 'cookMinutes')::integer,
    (p_recipe ->> 'costTier')::smallint,
    (p_recipe ->> 'costTierMax')::smallint,
    (p_recipe ->> 'difficulty')::smallint
  )
  on conflict (slug) do update set
    title = excluded.title,
    summary = excluded.summary,
    servings = excluded.servings,
    prep_minutes = excluded.prep_minutes,
    cook_minutes = excluded.cook_minutes,
    cost_tier = excluded.cost_tier,
    cost_tier_max = excluded.cost_tier_max,
    difficulty = excluded.difficulty
  returning id into v_id;

  delete from public.recipe_nutrition where recipe_id = v_id;
  delete from public.ingredients where recipe_id = v_id;
  delete from public.steps where recipe_id = v_id;
  delete from public.recipe_notes where recipe_id = v_id;
  delete from public.recipe_tags where recipe_id = v_id;

  insert into public.recipe_nutrition (
    recipe_id, position, kind, label, is_default, calories, carbs_g, fat_g, protein_g
  )
  select
    v_id,
    (n.ord - 1)::integer,
    (n.item ->> 'kind')::public.nutrition_kind,
    n.item ->> 'label',
    coalesce((n.item ->> 'isDefault')::boolean, false),
    (n.item ->> 'calories')::numeric,
    (n.item ->> 'carbsG')::numeric,
    (n.item ->> 'fatG')::numeric,
    (n.item ->> 'proteinG')::numeric
  from jsonb_array_elements(p_recipe -> 'nutrition') with ordinality as n(item, ord);

  insert into public.ingredients (
    recipe_id, position, group_name, raw_text, quantity, unit, name, note
  )
  select
    v_id,
    (i.ord - 1)::integer,
    i.item ->> 'group',
    i.item ->> 'raw',
    (i.item ->> 'quantity')::numeric,
    i.item ->> 'unit',
    i.item ->> 'name',
    i.item ->> 'note'
  from jsonb_array_elements(p_recipe -> 'ingredients') with ordinality as i(item, ord);

  insert into public.steps (recipe_id, position, phase, body_md, duration_minutes)
  select
    v_id,
    (s.ord - 1)::integer,
    (s.item ->> 'phase')::public.step_phase,
    s.item ->> 'body',
    (s.item ->> 'durationMinutes')::numeric
  from jsonb_array_elements(p_recipe -> 'steps') with ordinality as s(item, ord);

  insert into public.recipe_notes (recipe_id, position, kind, body_md)
  select
    v_id,
    (rn.ord - 1)::integer,
    (rn.item ->> 'kind')::public.note_kind,
    rn.item ->> 'body'
  from jsonb_array_elements(p_recipe -> 'notes') with ordinality as rn(item, ord);

  insert into public.tags (name, kind)
  select distinct t.item #>> '{}', 'attribute'::public.tag_kind
  from jsonb_array_elements(p_recipe -> 'tags') as t(item)
  on conflict (name) do nothing;

  insert into public.recipe_tags (recipe_id, tag_id)
  select distinct v_id, tg.id
  from public.tags tg
  where tg.name in (
    select t.item #>> '{}' from jsonb_array_elements(p_recipe -> 'tags') as t(item)
  );

  insert into public.recipe_revisions (recipe_id, snapshot, created_by)
  values (v_id, public.recipe_snapshot(v_id), (select auth.uid()));

  return v_id;
end;
$$;

-- Privileges. The import functions are for the server (service role) only.
-- service_role is granted explicitly because a project that does not auto-expose new tables
-- does not grant it either.
revoke execute on function public.recipe_snapshot(uuid) from public, anon, authenticated;
revoke execute on function public.import_recipe(jsonb) from public, anon, authenticated;
grant execute on function public.recipe_snapshot(uuid) to service_role;
grant execute on function public.import_recipe(jsonb) to service_role;

grant all on
  public.recipes,
  public.recipe_nutrition,
  public.ingredients,
  public.steps,
  public.recipe_notes,
  public.tags,
  public.recipe_tags,
  public.recipe_revisions
to service_role;

-- RLS policies call is_owner() as the requesting role, so every role that hits a policy needs it
grant execute on function public.is_owner() to anon, authenticated, service_role;
