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
| `pnpm recipe:import`     | Files on disk, including the 14 seed recipes                |

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

## Seed recipes

The 14 seed recipes live in `content/recipes/*.json` and are already in the database. The database
is the source of truth, so new and edited recipes go through the admin or the Claude connector,
not a markdown file.

```bash
pnpm recipe:import content/recipes --dry-run   # validate and diff, write nothing
pnpm recipe:import content/recipes             # import (new slugs only)
pnpm recipe:import content/recipes --overwrite # replace recipes that already exist
pnpm recipe:import:prod content/recipes        # same, against the hosted database
```

`docs/recipes.md` is the original book the seeds were parsed from (`pnpm recipe:parse`). It stays
for that parser and its tests. Nothing in the book build reads it.

Not every part of the original book maps onto a field. Toppings, option tables, and the corn pico
in the taco recipe are kept whole as `levers` notes, and per-batch and per-slider nutrition rows
are skipped because they derive from the per-serving rows.

For the Claude web project, paste [claude-project-knowledge.md](./claude-project-knowledge.md)
into the project's knowledge. It holds the rules and an example recipe.

## Photos

An import never creates a photo. Photos are uploaded or generated in the recipe editor, before
or after the first save, using the title and summary on screen with OpenAI's image API. You can
add notes and a reference photo, or use the current photo as the reference to refine it. Each
upload or attempt goes to Cloudflare R2 as `recipes/<slug>-<timestamp>.jpg`, and only the one you
pick is saved to `image_url`, with `image_is_placeholder` set. Uploads are shrunk in the browser to
2048px on the long edge first. Attempts you don't pick stay in the bucket. A reference photo is passed
through to OpenAI and not stored. Generating needs `OPENAI_API_KEY`, `R2_ACCOUNT_ID`,
`R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET`, and `R2_PUBLIC_URL`, and the editor says
which are missing. The book uses `image_url`, falling back to `recipes/<slug>.jpg`. The 14 seed
photos were uploaded once, and `pnpm photos:backfill` (`:prod` for hosted) points their
`image_url` at them.

## The printable book

The book is built from the published recipes in the database, so a recipe added through the API
appears in it with its photo.

- Recipes and the quick reference table are generated (`src/libs/recipes/bookMarkdown.ts`).
- The intro is `content/book/intro.md`. The reading guide, shopping and nutrition sections, and
  the about text come from `content/guides`, the same files the site shows under `/guides` and
  `/about`.
- `content/book/order.json` lists recipe slugs in book order. Recipes not listed follow, A to Z.
  Variants take a letter after their base (10, 10a).
- Each photo is downloaded from R2 (`R2_PUBLIC_URL`, object `recipes/<slug>.jpg`). A recipe with
  no photo in R2 prints without one, and without `R2_PUBLIC_URL` the book has no photos.

```bash
pnpm book:pdf                            # build/macro-makeovers.pdf from the local database
pnpm book:pdf:prod                       # same, from the hosted database
pnpm book:pdf --from content/recipes     # from the recipe JSON files, no database
pnpm book:md:db                          # only the markdown, build/recipes-from-db.md
```

It needs `pandoc` on the PATH and Playwright's Chromium (`pnpm exec playwright install chromium`).
Set `CHROMIUM_PATH` to use a browser you already have.

### Automatic rebuild

`.github/workflows/book.yml` builds the PDF and uploads it to the rolling `recipe-book` GitHub
Release. It runs on a push to `main` that touches `docs/**` or `content/**`, on manual dispatch,
and on `repository_dispatch` (`recipe-book-rebuild`), which the app fires when a published recipe
changes. A burst of edits cancels down to one build.

Setup:

- GitHub secret `DATABASE_URL` (the hosted database connection string, a read-only role if you
  can) and variable `R2_PUBLIC_URL`.
- Vercel env vars `GITHUB_REPO` (`owner/name`) and `GITHUB_DISPATCH_TOKEN`, a fine-grained token
  for this one repository with only Contents: Read and write. Without them publishing works and
  logs a skipped rebuild.
- If the release step fails with a 403, allow read and write workflow permissions in the repo's
  Actions settings.

The latest PDF is at
`https://github.com/c0d3ster/macro-makeovers/releases/download/recipe-book/macro-makeovers.pdf`.

## Recipe JSON

See the schema in `src/validations/RecipeImportValidation.ts`. Only `raw` is
required on an ingredient. `durationMinutes` on a step is optional and may be a
fraction (`0.25` is 15 seconds).

## Builds

A build is a version of a recipe that shares its method: Turkey Taco Grillers as grillers, a rice
bowl, or with beef. Builds are the rows of the nutrition table, in `builds`, and `nutrition` holds
only the traditional comparison rows. Older JSON with makeover rows in `nutrition` still imports,
with keys made from the labels.

- Each build has its own macros. A `swap` like `{ "turkey": "beef" }` trades the recipe tag and
  the matching title word, and `title` is there only when the swapped wording is not right. A
  build can also set its note, cost tier, difficulty, and times. The default build normally sets
  nothing beyond its macros.
- Ingredients, steps, and notes set `onlyBuilds` or `skipBuilds` to scope them to some builds.
- The recipe page switches builds from the nutrition table and keeps the choice in `?build=key`.
  The grid shows each recipe's best build for the active filters and goal.
- Saves match builds by key, so a build keeps its photo across edits. Renaming a key in the
  editor updates the lines that point at it. Builds are designed in
  [`prd/09-builds.md`](./prd/09-builds.md).

## Variants

A variant is a full recipe with its own directions, ingredients, nutrition, and
`costTier`, linked to the recipe it riffs on with `variantOf` (the base recipe's
slug). Use one only when the method changes. A swapped ingredient or a different
serving format is a build. The sausage hash brown bake is a variant. Flank steak bulgogi is one today and
becomes a build once its macros are confirmed.

- In the book, a number with a letter is a variant of the numbered recipe above it: `10a`
  Southwest Sausage Hash Brown Bake varies `10` Cheesy Hash Brown Bacon Bake. The book build
  assigns the numbers, so there is nothing to maintain.
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
