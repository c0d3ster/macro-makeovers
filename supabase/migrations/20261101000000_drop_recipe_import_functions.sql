-- Recipe imports and reads go through the app's GraphQL API and Drizzle now, so the two SQL
-- functions that used to do that work are unused. Row-level security on the tables stays as a
-- second line of defense for anything that reaches the database through the Supabase API.

drop function if exists public.import_recipe(jsonb);
drop function if exists public.recipe_snapshot(uuid);
