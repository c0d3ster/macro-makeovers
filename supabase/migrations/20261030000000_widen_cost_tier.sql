-- Cost tiers run $ to $$$$$, so the check allows 1 to 5
alter table public.recipes drop constraint recipes_cost_tier_check;
alter table public.recipes add constraint recipes_cost_tier_check check (cost_tier between 1 and 5);
