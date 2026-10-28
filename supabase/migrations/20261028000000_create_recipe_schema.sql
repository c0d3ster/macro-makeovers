-- Recipe schema: one recipes table plus child tables for everything that repeats.
-- Public can read published recipes. Only owners can write, enforced here and not only in the app.

create type public.recipe_status as enum ('draft', 'published');
create type public.recipe_access as enum ('free', 'premium');
create type public.nutrition_kind as enum ('makeover', 'traditional');
create type public.step_phase as enum ('prep', 'cook');
create type public.note_kind as enum ('make_or_break', 'fixes', 'levers', 'tip');
create type public.tag_kind as enum ('category', 'method', 'attribute');

-- The owner is anyone with an admin role on public.users.
-- Kept in one function so policies do not need to change if the role model does.
create function public.is_owner()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.users
    where auth_id = (select auth.uid())
      and role in ('admin', 'super_admin')
  );
$$;

create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table public.recipes (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  summary text not null,
  servings integer not null check (servings > 0),
  prep_minutes integer not null check (prep_minutes >= 0),
  cook_minutes integer not null check (cook_minutes >= 0),
  cost_tier smallint not null check (cost_tier between 1 and 4),
  difficulty smallint not null check (difficulty between 1 and 5),
  status public.recipe_status not null default 'draft',
  access public.recipe_access not null default 'free',
  image_url text,
  search tsvector generated always as (
    setweight(to_tsvector('english', title), 'A') ||
    setweight(to_tsvector('english', summary), 'B')
  ) stored,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index recipes_status_idx on public.recipes (status);
create index recipes_search_idx on public.recipes using gin (search);

create trigger recipes_set_updated_at
  before update on public.recipes
  for each row execute function public.set_updated_at();

-- Nutrition is per serving and per variant. Ratios are computed, not stored.
create table public.recipe_nutrition (
  id uuid primary key default gen_random_uuid(),
  recipe_id uuid not null references public.recipes (id) on delete cascade,
  kind public.nutrition_kind not null,
  label text not null,
  is_default boolean not null default false,
  calories numeric(7, 1) not null check (calories >= 0),
  carbs_g numeric(6, 1) not null check (carbs_g >= 0),
  fat_g numeric(6, 1) not null check (fat_g >= 0),
  protein_g numeric(6, 1) not null check (protein_g >= 0)
);

create index recipe_nutrition_recipe_idx on public.recipe_nutrition (recipe_id);
-- At most one featured makeover build per recipe
create unique index recipe_nutrition_one_default_idx
  on public.recipe_nutrition (recipe_id)
  where is_default;

-- raw_text is the display source of truth. Parsed fields feed scaling and grocery lists later.
create table public.ingredients (
  id uuid primary key default gen_random_uuid(),
  recipe_id uuid not null references public.recipes (id) on delete cascade,
  group_name text,
  position integer not null,
  raw_text text not null,
  quantity numeric,
  unit text,
  name text,
  note text,
  category text,
  search tsvector generated always as (to_tsvector('english', raw_text)) stored
);

create index ingredients_recipe_idx on public.ingredients (recipe_id, position);
create index ingredients_search_idx on public.ingredients using gin (search);

create table public.steps (
  id uuid primary key default gen_random_uuid(),
  recipe_id uuid not null references public.recipes (id) on delete cascade,
  phase public.step_phase not null,
  position integer not null,
  body_md text not null,
  -- Optional, so a later cook mode can run per-step timers without a migration
  duration_minutes smallint check (duration_minutes > 0)
);

create index steps_recipe_idx on public.steps (recipe_id, position);

-- The book's make-or-break, fixes, and levers sections
create table public.recipe_notes (
  id uuid primary key default gen_random_uuid(),
  recipe_id uuid not null references public.recipes (id) on delete cascade,
  kind public.note_kind not null,
  position integer not null,
  body_md text not null
);

create index recipe_notes_recipe_idx on public.recipe_notes (recipe_id, position);

create table public.tags (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  kind public.tag_kind not null
);

create table public.recipe_tags (
  recipe_id uuid not null references public.recipes (id) on delete cascade,
  tag_id uuid not null references public.tags (id) on delete cascade,
  primary key (recipe_id, tag_id)
);

create index recipe_tags_tag_idx on public.recipe_tags (tag_id);

-- One snapshot per save, so edits are reversible
create table public.recipe_revisions (
  id uuid primary key default gen_random_uuid(),
  recipe_id uuid not null references public.recipes (id) on delete cascade,
  snapshot jsonb not null,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

create index recipe_revisions_recipe_idx on public.recipe_revisions (recipe_id, created_at desc);

-- Row Level Security
alter table public.recipes enable row level security;
alter table public.recipe_nutrition enable row level security;
alter table public.ingredients enable row level security;
alter table public.steps enable row level security;
alter table public.recipe_notes enable row level security;
alter table public.tags enable row level security;
alter table public.recipe_tags enable row level security;
alter table public.recipe_revisions enable row level security;

-- Recipes: anyone reads published rows, owners read drafts too and are the only writers.
create policy "Published recipes are public, owners see drafts"
  on public.recipes
  for select
  to anon, authenticated
  using (status = 'published' or (select public.is_owner()));

create policy "Owners can insert recipes"
  on public.recipes
  for insert
  to authenticated
  with check ((select public.is_owner()));

create policy "Owners can update recipes"
  on public.recipes
  for update
  to authenticated
  using ((select public.is_owner()))
  with check ((select public.is_owner()));

create policy "Owners can delete recipes"
  on public.recipes
  for delete
  to authenticated
  using ((select public.is_owner()));

-- Child tables: readable when the parent recipe is readable (the recipes policy applies
-- inside the subquery), writable by owners only.
create policy "Readable with parent recipe"
  on public.recipe_nutrition
  for select
  to anon, authenticated
  using (exists (select 1 from public.recipes r where r.id = recipe_id));

create policy "Owners can write nutrition"
  on public.recipe_nutrition
  for all
  to authenticated
  using ((select public.is_owner()))
  with check ((select public.is_owner()));

create policy "Readable with parent recipe"
  on public.ingredients
  for select
  to anon, authenticated
  using (exists (select 1 from public.recipes r where r.id = recipe_id));

create policy "Owners can write ingredients"
  on public.ingredients
  for all
  to authenticated
  using ((select public.is_owner()))
  with check ((select public.is_owner()));

create policy "Readable with parent recipe"
  on public.steps
  for select
  to anon, authenticated
  using (exists (select 1 from public.recipes r where r.id = recipe_id));

create policy "Owners can write steps"
  on public.steps
  for all
  to authenticated
  using ((select public.is_owner()))
  with check ((select public.is_owner()));

create policy "Readable with parent recipe"
  on public.recipe_notes
  for select
  to anon, authenticated
  using (exists (select 1 from public.recipes r where r.id = recipe_id));

create policy "Owners can write recipe notes"
  on public.recipe_notes
  for all
  to authenticated
  using ((select public.is_owner()))
  with check ((select public.is_owner()));

create policy "Tags are public"
  on public.tags
  for select
  to anon, authenticated
  using (true);

create policy "Owners can write tags"
  on public.tags
  for all
  to authenticated
  using ((select public.is_owner()))
  with check ((select public.is_owner()));

create policy "Readable with parent recipe"
  on public.recipe_tags
  for select
  to anon, authenticated
  using (exists (select 1 from public.recipes r where r.id = recipe_id));

create policy "Owners can write recipe tags"
  on public.recipe_tags
  for all
  to authenticated
  using ((select public.is_owner()))
  with check ((select public.is_owner()));

-- Revisions are never public
create policy "Owners can read revisions"
  on public.recipe_revisions
  for select
  to authenticated
  using ((select public.is_owner()));

create policy "Owners can write revisions"
  on public.recipe_revisions
  for insert
  to authenticated
  with check ((select public.is_owner()));
