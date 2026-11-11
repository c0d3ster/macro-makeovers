-- Builds now hold the makeover numbers (20261111000000_create_recipe_builds), and the app reads
-- only traditional rows from recipe_nutrition. Remove what that migration left in place for the
-- code that was deployed before it.
delete from public.recipe_nutrition where kind = 'makeover';
drop index public.recipe_nutrition_one_default_idx;
alter table public.recipe_nutrition drop column is_default;
