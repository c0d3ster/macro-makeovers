-- Basket data (PRD 08) moves from src/libs/basket/basketData.ts into the database, so a recipe
-- carries its shopping lines through import. basket_items is the shared price book. A recipe's
-- lines are what one batch buys, and a build's lines change them (0 drops a line). Cost per
-- serving is derived from lines and prices, so nothing here stores it.

create type public.store_section as enum (
  'produce', 'meat', 'dairy', 'bakery', 'frozen', 'pantry', 'spices'
);

create table public.basket_items (
  key text primary key check (key ~ '^[a-z0-9]+(_[a-z0-9]+)*$'),
  name text not null,
  -- The pack as the shelf labels it, like "16 oz tub" or "per lb"
  pack text not null,
  -- How much of unit one pack holds. For "per lb" items, 1 lb.
  pack_quantity numeric(10, 4) not null check (pack_quantity > 0),
  unit text not null,
  -- Lowest price found for one pack (or one lb for "per lb" items)
  price numeric(8, 2) not null check (price >= 0),
  section public.store_section not null,
  -- A staple most kitchens already have, like oil and spices
  pantry boolean not null default false,
  -- Spoils fast once opened, so a leftover is likely wasted
  perishable boolean not null default false,
  -- Where the price came from, as a store code from docs/cost-estimates.md (W Walmart, K Kroger,
  -- U Martin's receipt, X estimate)
  price_source text,
  -- Looked up and not yet checked on a shelf or a receipt
  is_estimate boolean not null default false,
  priced_on date not null,
  updated_at timestamp with time zone not null default now()
);

-- Larger sizes of the same product. The item's own pack is the smallest.
create table public.basket_item_sizes (
  item_key text not null references public.basket_items (key) on update cascade on delete cascade,
  pack text not null,
  pack_quantity numeric(10, 4) not null check (pack_quantity > 0),
  price numeric(8, 2) not null check (price >= 0),
  primary key (item_key, pack_quantity)
);

-- What one batch of a recipe buys, in each item's unit
create table public.recipe_basket_lines (
  recipe_id uuid not null references public.recipes (id) on delete cascade,
  -- An item a recipe still uses cannot be deleted
  item_key text not null references public.basket_items (key) on update cascade on delete restrict,
  quantity numeric(10, 4) not null check (quantity > 0),
  position integer not null default 0,
  primary key (recipe_id, item_key)
);

-- A build's changes to its recipe's lines. 0 drops a line the build doesn't use.
create table public.recipe_build_basket_lines (
  build_id uuid not null references public.recipe_builds (id) on delete cascade,
  item_key text not null references public.basket_items (key) on update cascade on delete restrict,
  quantity numeric(10, 4) not null check (quantity >= 0),
  position integer not null default 0,
  primary key (build_id, item_key)
);

create index recipe_basket_lines_item_idx on public.recipe_basket_lines (item_key);
create index recipe_build_basket_lines_item_idx on public.recipe_build_basket_lines (item_key);

create trigger basket_items_set_updated_at
  before update on public.basket_items
  for each row execute function public.set_updated_at();

alter table public.basket_items enable row level security;
alter table public.basket_item_sizes enable row level security;
alter table public.recipe_basket_lines enable row level security;
alter table public.recipe_build_basket_lines enable row level security;

create policy "Anyone can read basket items"
  on public.basket_items for select to anon, authenticated using (true);
create policy "Owners can write basket items"
  on public.basket_items for all to authenticated
  using ((select public.is_owner())) with check ((select public.is_owner()));

create policy "Anyone can read basket item sizes"
  on public.basket_item_sizes for select to anon, authenticated using (true);
create policy "Owners can write basket item sizes"
  on public.basket_item_sizes for all to authenticated
  using ((select public.is_owner())) with check ((select public.is_owner()));

create policy "Readable with parent recipe"
  on public.recipe_basket_lines for select to anon, authenticated
  using (exists (select 1 from public.recipes r where r.id = recipe_id));
create policy "Owners can write recipe basket lines"
  on public.recipe_basket_lines for all to authenticated
  using ((select public.is_owner())) with check ((select public.is_owner()));

create policy "Readable with parent build"
  on public.recipe_build_basket_lines for select to anon, authenticated
  using (
    exists (
      select 1
      from public.recipe_builds b
      join public.recipes r on r.id = b.recipe_id
      where b.id = build_id
    )
  );
create policy "Owners can write build basket lines"
  on public.recipe_build_basket_lines for all to authenticated
  using ((select public.is_owner())) with check ((select public.is_owner()));

revoke all on public.basket_items, public.basket_item_sizes, public.recipe_basket_lines,
  public.recipe_build_basket_lines from anon, authenticated;
grant select on public.basket_items, public.basket_item_sizes, public.recipe_basket_lines,
  public.recipe_build_basket_lines to anon;
grant select, insert, update, delete on public.basket_items, public.basket_item_sizes,
  public.recipe_basket_lines, public.recipe_build_basket_lines to authenticated;
