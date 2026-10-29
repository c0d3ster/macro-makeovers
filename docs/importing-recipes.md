# Importing recipes

Every recipe enters the database through one function, `importRecipe`
(`src/libs/recipes`). It validates the recipe against the shared Zod schema
(`src/validations/RecipeImportValidation.ts`), then upserts it by slug in one
transaction through the `import_recipe` database function.

- A new slug lands as a **draft**.
- An existing slug is **never overwritten silently**. The import returns a
  field-level diff, and you confirm with `--overwrite` (CLI) or the Overwrite
  button (admin page).
- An overwrite keeps the recipe's current status, so re-importing a published
  recipe does not take it offline.
- Every import writes a row to `recipe_revisions` in the same shape as the
  import JSON, so any revision can be re-imported.
- Unknown tags are created as `attribute` tags.

## Ways in

| Where                    | Use it for                                    |
| ------------------------ | --------------------------------------------- |
| `/admin/import`          | Paste the JSON an agent produced (owner only) |
| `pnpm recipe:import`     | Files on disk, including the 13 seed recipes  |
| `POST /api/admin/import` | Later: send JSON straight from an agent       |

## The recipe book to the database

`docs/recipes.md` is the editable source for the 13 seed recipes.

```bash
pnpm recipe:parse                       # docs/recipes.md -> content/recipes/*.json
pnpm recipe:import content/recipes --dry-run   # validate and diff, write nothing
pnpm recipe:import content/recipes             # import (new slugs only)
pnpm recipe:import content/recipes --overwrite # replace recipes that already exist
```

`recipe:parse` checks each recipe's default nutrition row against the quick
reference table at the top of the book and fails if they disagree. Tags are not
in the book, so they are assigned in `scripts/recipesToJson.ts`.

Not every part of the book maps onto a field. Toppings, option tables, and the
corn pico in the taco recipe are kept whole as `levers` notes, and per-batch
and per-slider nutrition rows are skipped because they derive from the
per-serving rows.

## Importing into the hosted project

The CLI reads `.env` (the local Docker stack) and then `.env.local`. To write to
the hosted project, set the URL and the **secret key** for one command only,
and never put them in a file in the repo:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co \
SUPABASE_SECRET_KEY=<secret key from the dashboard> \
pnpm recipe:import content/recipes
```

The secret key bypasses RLS. It is used only on the server, and the admin page
checks `public.is_owner()` before using it.

## Recipe JSON

See the schema in `src/validations/RecipeImportValidation.ts`. Only `raw` is
required on an ingredient. `durationMinutes` on a step is optional and may be a
fraction (`0.25` is 15 seconds).

## Cost tiers

`costTier` (1 to 4) is the price band for the featured build, from the `$` in
the recipe heading. A recipe whose builds are priced differently carries a
range: `## 9. Beef Bulgogi | $$$–$$$$` parses to `costTier: 3` and
`costTierMax: 4`. `costTierMax` is optional and must be above `costTier`.
The bands and per-serving costs behind the tiers are in
[`cost-estimates.md`](./cost-estimates.md), and a test checks they agree.
