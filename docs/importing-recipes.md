# Importing recipes

Every recipe enters the database through one function, `importRecipe`
(`src/libs/recipes`). It validates the recipe against the shared Zod schema
(`src/validations/RecipeImportValidation.ts`), then upserts it by slug in one
Drizzle transaction (`RecipeRepository`). Either every table is written or none is.

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

| Where                    | Use it for                                                  |
| ------------------------ | ----------------------------------------------------------- |
| `importRecipe` (GraphQL) | The write path for the admin page and the Claude connector  |
| `/admin/import`          | Paste the JSON an agent produced (owner only), calls it     |
| `/api/mcp`               | Claude connector: validate and import from a chat, calls it |
| `pnpm recipe:import`     | Files on disk, including the 13 seed recipes                |

The mutation takes the recipe as JSON, plus `overwrite` and `dryRun`, and returns a
status, any field issues, and the field-level changes. Only the site owner can call it.
The CLI uses the same `importRecipe` library function and Drizzle store directly, because it
runs outside the web app. The Drizzle connection is the database owner's and bypasses RLS, so
the mutation checks the caller first.

## Reading recipes

Writes go through GraphQL mutations (`importRecipe`, `setRecipeStatus`). Server components
read the other way: they call `RecipeService` directly, which uses `RecipeRepository` (Drizzle),
so there is no query layer between a page and the data. The recipe pages stay buildable ahead
of time because nothing needs a running server.

| Loader                                   | Who        | Returns                             |
| ---------------------------------------- | ---------- | ----------------------------------- |
| `loadRecipeBrowse`, `loadRecipe`         | Anyone     | Published recipes only              |
| `loadAdminRecipes`, `loadEditableRecipe` | Owner only | Drafts too, and the editor's recipe |

Drizzle connects as the database owner and bypasses row-level security, so "published only" is
written into the repository's public queries, and the admin loaders check the owner before
reading drafts. The RLS policies stay on the tables as a second line of defense for anything
that reaches them through the Supabase API.

## Importing from Claude (MCP connector)

`/api/mcp` is a remote MCP server with three tools: `get_recipe_schema`, `validate_recipe`
(dry run, writes nothing), and `import_recipe`. Each call runs the `importRecipe` mutation
in-process. Supabase Auth is the OAuth server, and the route accepts only tokens that
Supabase issued through it to the site owner.

One-time setup:

1. Supabase dashboard, Authentication, OAuth Server: turn it on, set the Authorization Path
   to `/oauth/consent`, and turn on dynamic client registration. The Site URL under URL
   Configuration must be the public site URL.
2. Use asymmetric JWT signing keys (Authentication, JWT Keys), which the OAuth server
   recommends and the route verifies locally.
3. Set `NEXT_PUBLIC_APP_URL` to the public site URL. The connector URL and the OAuth
   metadata are built from it.
4. In Claude, Customize, Connectors, Add custom connector: URL `https://<site>/api/mcp`,
   authentication "Sign in now", and register the OAuth client automatically.
5. Approve the connection on `/oauth/consent`. The page only approves return addresses
   listed in `src/libs/mcp/allowedClients.ts`. If it refuses Claude, it shows the address
   it saw, and that origin belongs on the list.

Approving gives the app a Supabase token for the owner, so treat the connection like a
signed-in session. Remove the connector in Claude and revoke the client in the Supabase
dashboard to cut it off.

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

## The printable book

`pnpm book:pdf` renders `docs/recipes.md` to `build/macro-makeovers.pdf` with each recipe's
photo downloaded from Cloudflare R2 (`R2_PUBLIC_URL`, object `recipes/<slug>.jpg`, matched by the
recipe title in its heading). Without `R2_PUBLIC_URL` the book builds with no photos. It needs `pandoc` on the PATH and Playwright's Chromium
(`pnpm exec playwright install chromium`). Set `CHROMIUM_PATH` to use a browser you already have.
The build folder is gitignored, so upload the PDF wherever the book is kept.

## Recipe JSON

See the schema in `src/validations/RecipeImportValidation.ts`. Only `raw` is
required on an ingredient. `durationMinutes` on a step is optional and may be a
fraction (`0.25` is 15 seconds).

## Variants

A variant is a full recipe with its own directions, ingredients, nutrition, and
`costTier`, linked to the recipe it riffs on with `variantOf` (the base recipe's
slug). Flank steak bulgogi and the sausage hash brown bake are variants.

- In `docs/recipes.md` a heading numbered with a letter is a variant of the
  numbered recipe above it: `## 10a. Southwest Sausage Hash Brown Bake` varies
  `## 10. Cheesy Hash Brown Bacon Bake`. Give it its own row in the quick
  reference table.
- The base has to exist before its variant. `pnpm recipe:import` imports bases
  first, and a variant whose base is missing fails with a clear message.
- Variants are one level deep: a variant cannot be a base, and a recipe that
  has variants cannot become one.
- A family's price range is computed from the base and its variants when it is
  shown, so it cannot go stale. The tiers behind it are in
  [`cost-estimates.md`](./cost-estimates.md), and a test checks they agree.

## Importing into the hosted project

`pnpm recipe:import:prod` takes the same arguments as `pnpm recipe:import` but
loads `.env.production` and `.env.production.local` instead of `.env` and
`.env.local`.

- `.env.local` and `.env.production.local` (both gitignored) can set `DATABASE_URL`.
  The local default in `.env` points at the Docker stack.
- For the hosted project, put the **direct** connection string from the Supabase
  dashboard (Connect, port 5432, not the transaction pooler) in
  `.env.production.local`. It carries the database password, so never put it in a
  file that is committed.

Run `supabase db push --linked` first so the hosted database has the latest
migrations, and start with `--dry-run`.
