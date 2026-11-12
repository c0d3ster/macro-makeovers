-- Courses and components. A course says what a dish is on a menu. A build can override it, so a
-- Greek salad can be a side by default and a main with grilled chicken. A component is a recipe
-- another recipe uses, like a salsa on a bowl: the dish shows it inline, and the component's
-- page lists the dishes that use it. Components are one level deep, enforced on import.

create type public.recipe_course as enum ('breakfast', 'appetizer', 'main', 'side', 'sauce');

alter table public.recipes
  add column course public.recipe_course not null default 'main',
  -- What one serving is, like "1/2 cup", and what the batch makes, like "2.5 cups". Optional, and
  -- mostly for sides and sauces, where "a serving" says little on its own.
  add column serving_size text,
  add column makes text;

-- Null falls back to the recipe's course
alter table public.recipe_builds
  add column course public.recipe_course;

-- A dish can link one component twice, scoped to different builds, when they use different
-- amounts: 1/2 cup of pico on the grillers, 3/4 cup on the rice bowl
create table public.recipe_components (
  id uuid primary key default gen_random_uuid(),
  recipe_id uuid not null references public.recipes (id) on delete cascade,
  -- A recipe still in use cannot be deleted
  component_id uuid not null references public.recipes (id) on delete restrict,
  position integer not null,
  -- How much the dish uses, as the page prints it: "1/2 cup per bowl"
  amount text,
  note_md text,
  -- Component servings in one dish serving, for what a serving of the dish carries from it
  servings_per_serving numeric(6, 2) not null default 1 check (servings_per_serving > 0),
  -- The component's build to show, by key. Null uses its default build.
  component_build text,
  -- Which of the dish's builds use the component. Empty on both means every build.
  only_builds text[] not null default '{}',
  skip_builds text[] not null default '{}',
  check (recipe_id <> component_id),
  check (cardinality(only_builds) = 0 or cardinality(skip_builds) = 0)
);

create index recipe_components_recipe_idx on public.recipe_components (recipe_id, position);
create index recipe_components_component_idx on public.recipe_components (component_id);

alter table public.recipe_components enable row level security;

create policy "Readable with parent recipe"
  on public.recipe_components
  for select
  to anon, authenticated
  using (exists (select 1 from public.recipes r where r.id = recipe_id));

create policy "Owners can write components"
  on public.recipe_components
  for all
  to authenticated
  using ((select public.is_owner()))
  with check ((select public.is_owner()));

revoke all on public.recipe_components from anon, authenticated;
grant select on public.recipe_components to anon;
grant select, insert, update, delete on public.recipe_components to authenticated;
