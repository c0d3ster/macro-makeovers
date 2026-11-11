-- Builds: lightweight versions of one recipe that share its method. Each build has its own
-- macros and can override a few recipe fields. Ingredients, steps, and notes can be scoped to
-- some builds. recipe_nutrition keeps only the traditional comparison rows.

create table public.recipe_builds (
  id uuid primary key default gen_random_uuid(),
  recipe_id uuid not null references public.recipes (id) on delete cascade,
  key text not null check (key ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  label text not null,
  position integer not null default 0,
  is_default boolean not null default false,
  -- False for components like "Filling only": selectable on the page, never leads a card
  listed boolean not null default true,
  calories numeric(7, 1) not null check (calories >= 0),
  carbs_g numeric(6, 1) not null check (carbs_g >= 0),
  fat_g numeric(6, 1) not null check (fat_g >= 0),
  protein_g numeric(6, 1) not null check (protein_g >= 0),
  -- Overrides. Null falls back to the recipe.
  -- Tag swaps, like {"turkey": "beef"}: the build drops the first tag for the second, and the
  -- word in the title swaps with it
  swap jsonb not null default '{}' check (jsonb_typeof(swap) = 'object'),
  -- Only when the swapped title is not the wording wanted, like "Lean Beef Taco Grillers"
  title text,
  note_md text,
  cost_tier smallint check (cost_tier between 1 and 5),
  difficulty smallint check (difficulty between 1 and 5),
  prep_minutes integer check (prep_minutes >= 0),
  cook_minutes integer check (cook_minutes >= 0),
  -- The build's own photo. Null uses the recipe photo.
  image_url text,
  image_is_placeholder boolean not null default false,
  unique (recipe_id, key)
);

create index recipe_builds_recipe_idx on public.recipe_builds (recipe_id, position);
-- Exactly one default per recipe is checked on import. The index keeps it to at most one.
create unique index recipe_builds_one_default_idx
  on public.recipe_builds (recipe_id)
  where is_default;

-- Which builds a line, step, or note belongs to. Empty on both means every build.
alter table public.ingredients
  add column only_builds text[] not null default '{}',
  add column skip_builds text[] not null default '{}',
  add constraint ingredients_build_scope_check
    check (cardinality(only_builds) = 0 or cardinality(skip_builds) = 0);

alter table public.steps
  add column only_builds text[] not null default '{}',
  add column skip_builds text[] not null default '{}',
  add constraint steps_build_scope_check
    check (cardinality(only_builds) = 0 or cardinality(skip_builds) = 0);

alter table public.recipe_notes
  add column only_builds text[] not null default '{}',
  add column skip_builds text[] not null default '{}',
  add constraint recipe_notes_build_scope_check
    check (cardinality(only_builds) = 0 or cardinality(skip_builds) = 0);

-- Move every makeover row into a build. Keys come from the label, with the position added
-- when two labels in one recipe would collide. A recipe with no default flagged gets its
-- first makeover as the default, the same rule the app already used.
insert into public.recipe_builds (
  recipe_id, key, label, position, is_default, calories, carbs_g, fat_g, protein_g
)
select
  recipe_id,
  case
    when count(*) over (partition by recipe_id, base_key) > 1
      then base_key || '-' || (row_number() over (partition by recipe_id, base_key order by position))
    else base_key
  end,
  label,
  row_number() over (partition by recipe_id order by position) - 1,
  case
    when bool_or(is_default) over (partition by recipe_id) then is_default
    else row_number() over (partition by recipe_id order by position) = 1
  end,
  calories,
  carbs_g,
  fat_g,
  protein_g
from (
  select
    n.*,
    coalesce(
      nullif(trim(both '-' from regexp_replace(lower(label), '[^a-z0-9]+', '-', 'g')), ''),
      'build'
    ) as base_key
  from public.recipe_nutrition n
  where kind = 'makeover'
) makeovers;

-- The makeover rows and is_default stay for now, so the code already deployed keeps working
-- until the code that reads recipe_builds is live. The app now reads only the traditional rows
-- from recipe_nutrition. Remove the rest in a later migration, once this code is deployed:
--   delete from public.recipe_nutrition where kind = 'makeover';
--   drop index public.recipe_nutrition_one_default_idx;
--   alter table public.recipe_nutrition drop column is_default;

alter table public.recipe_builds enable row level security;

create policy "Readable with parent recipe"
  on public.recipe_builds
  for select
  to anon, authenticated
  using (exists (select 1 from public.recipes r where r.id = recipe_id));

create policy "Owners can write builds"
  on public.recipe_builds
  for all
  to authenticated
  using ((select public.is_owner()))
  with check ((select public.is_owner()));

revoke all on public.recipe_builds from anon, authenticated;
grant select on public.recipe_builds to anon;
grant select, insert, update, delete on public.recipe_builds to authenticated;
