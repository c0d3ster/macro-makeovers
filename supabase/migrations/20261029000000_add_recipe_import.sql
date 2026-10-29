-- Recipe import: an atomic upsert-by-slug and a snapshot function.
-- The snapshot has the same shape as the import payload, so it doubles as the "before" side of
-- an import diff and as the revision history, and any revision can be re-imported.

-- Nutrition rows keep the order they were imported in
alter table public.recipe_nutrition
  add column position integer not null default 0;

-- A variant is a full recipe with its own directions, linked to the recipe it riffs on
-- (flank steak bulgogi, the sausage hash brown bake). Variants are one level deep.
alter table public.recipes
  add column variant_of uuid references public.recipes (id),
  add constraint recipes_variant_not_self check (variant_of is null or variant_of <> id);

create index recipes_variant_of_idx on public.recipes (variant_of);

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
    'variantOf', (select b.slug from public.recipes b where b.id = r.variant_of),
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
  v_base_id uuid;
begin
  if p_recipe ->> 'variantOf' is not null then
    select id into v_base_id from public.recipes where slug = p_recipe ->> 'variantOf';
    if v_base_id is null then
      raise exception 'Base recipe "%" does not exist. Import it first.', p_recipe ->> 'variantOf';
    end if;
    if exists (select 1 from public.recipes where id = v_base_id and variant_of is not null) then
      raise exception '"%" is itself a variant, and variants are one level deep.', p_recipe ->> 'variantOf';
    end if;
    if exists (
      select 1 from public.recipes v
      join public.recipes self on self.id = v.variant_of
      where self.slug = p_recipe ->> 'slug'
    ) then
      raise exception '"%" has variants, so it cannot become a variant itself.', p_recipe ->> 'slug';
    end if;
  end if;

  insert into public.recipes (
    slug, title, summary, servings, prep_minutes, cook_minutes, cost_tier, difficulty, variant_of
  )
  values (
    p_recipe ->> 'slug',
    p_recipe ->> 'title',
    p_recipe ->> 'summary',
    (p_recipe ->> 'servings')::integer,
    (p_recipe ->> 'prepMinutes')::integer,
    (p_recipe ->> 'cookMinutes')::integer,
    (p_recipe ->> 'costTier')::smallint,
    (p_recipe ->> 'difficulty')::smallint,
    v_base_id
  )
  on conflict (slug) do update set
    title = excluded.title,
    summary = excluded.summary,
    servings = excluded.servings,
    prep_minutes = excluded.prep_minutes,
    cook_minutes = excluded.cook_minutes,
    cost_tier = excluded.cost_tier,
    difficulty = excluded.difficulty,
    variant_of = excluded.variant_of
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
