# Macro Makeovers Site: Implementation Plan

Oct 18, 2026 · @c0d3ster

## Goals and scope

Phase 1 is a free, public recipe site on macromakeovers.com where you can view, filter, add, and edit recipes, with a one-step import from the agent conversations you already use to build them.

**In scope**

- Browse and filter recipes by protein, calories, cook time, cost, difficulty, and tags
- Recipe pages with a servings scaler, nutrition, and a makeover vs traditional comparison
- Owner-only add and edit, with draft and publish
- Import from an agent conversation as validated JSON
- Clean share links with preview cards, built for phone viewing

**Deferred**

Subscriptions, paywall, meal planning, goal-based personalization, carb cycling, and grocery ordering. Ingredients are stored in structured form from day one, so none of those later phases need a data migration.

## Stack and architecture

Next.js on Vercel renders the pages, and Supabase holds the data and the login. Reads go through Server Components, so public pages are fast and cacheable and the browser never needs database keys.

| Layer          | Choice                                       | Why                                                        |
| -------------- | -------------------------------------------- | ---------------------------------------------------------- |
| Framework      | Next.js App Router, TypeScript strict        | Server Components, ISR, route handlers for import          |
| Styling        | Tailwind CSS, atomic design                  | Matches your component conventions                         |
| Database       | Supabase Postgres                            | Relational fits recipes, ingredients, and later meal plans |
| Auth           | Supabase Auth, Google OAuth, `@supabase/ssr` | Owner login now, user accounts later                       |
| Access control | Row Level Security                           | Public read, owner-only write, paywall rules later         |
| Validation     | Zod, one shared recipe schema                | Same rules for import, edit form, and API                  |
| Types          | Supabase CLI generated types                 | Typed queries without hand-written models                  |
| Hosting        | Vercel on macromakeovers.com                 | Branch previews and the ISR cache                          |
| Images         | Supabase Storage, later                      | Nullable `image_url` is ready now                          |

Public pages are statically generated and revalidated by tag whenever you save an edit, so cached pages keep serving even if the database is briefly unavailable.

## Data model

One `recipes` table with child tables for everything that repeats. Nutrition is stored per variant, so "fully loaded" chili, the rice bowl griller, and every traditional comparison are rows, not special cases.

| Table                 | Key columns                                                                                                                                                                                    | Notes                                                                                          |
| --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| `recipes`             | `id`, `slug`, `title`, `summary`, `servings`, `prep_minutes`, `cook_minutes`, `cost_tier` (1-5), `variant_of` (optional, the base recipe), `difficulty` (1-5), `status`, `access`, `image_url` | `status` is draft or published. `access` defaults to free and is the later paywall hook.       |
| `recipe_nutrition`    | `recipe_id`, `kind` (makeover or traditional), `label`, `is_default`, `calories`, `carbs_g`, `fat_g`, `protein_g`                                                                              | Ratio is computed, not stored. Drives the comparison component.                                |
| `ingredients`         | `recipe_id`, `group_name`, `position`, `raw_text`, `quantity`, `unit`, `name`, `note`, `category`                                                                                              | `raw_text` is the display source of truth. Parsed fields feed scaling and grocery lists later. |
| `steps`               | `recipe_id`, `phase` (prep or cook), `position`, `body_md`                                                                                                                                     | Ordered per recipe.                                                                            |
| `recipe_notes`        | `recipe_id`, `kind` (make_or_break, fixes, levers, tip), `position`, `body_md`                                                                                                                 | Holds the book's make-or-break, fixes, and levers sections.                                    |
| `tags`, `recipe_tags` | `name`, `kind` (category, method, attribute)                                                                                                                                                   | For example pasta, air fryer, freezer friendly, high protein.                                  |
| `recipe_revisions`    | `recipe_id`, `snapshot` (jsonb), `created_at`                                                                                                                                                  | One snapshot per save, so edits are reversible.                                                |
| `users`               | `auth_id`, `email`, `role` (client, developer, admin, or super_admin; admin and super_admin are the owner)                                                                                     |

Whole-batch rows and C/F/P ratios from the book are derived from per-serving values and servings, so they are not stored.

## Import pipeline

Every recipe enters the database through one function, `importRecipe`, which validates a JSON payload against a shared Zod schema and upserts it by slug as a draft. The CLI, the admin paste page, and a later API route all call it.

1. At the end of a recipe conversation, a skill or saved prompt has the agent emit the final recipe as one JSON block in the schema below.
2. Paste it into `/admin/import`, or run `pnpm recipe:import path/to/recipe.json`.
3. Validation runs. Errors name the exact field, so you fix the JSON or ask the agent to correct it.
4. A new slug lands as a draft. An existing slug shows a field-level diff before anything is overwritten.
5. Review the draft in the editor, then publish.

```ts
import { z } from 'zod'

export const nutritionSchema = z.object({
  kind: z.enum(['makeover', 'traditional']),
  label: z.string(),
  isDefault: z.boolean().default(false),
  calories: z.number(),
  carbsG: z.number(),
  fatG: z.number(),
  proteinG: z.number(),
})

export const recipeImportSchema = z.object({
  slug: z.string(),
  title: z.string(),
  summary: z.string(),
  servings: z.number().int().positive(),
  prepMinutes: z.number().int(),
  cookMinutes: z.number().int(),
  costTier: z.number().int().min(1).max(5),
  difficulty: z.number().int().min(1).max(5),
  tags: z.array(z.string()),
  nutrition: z.array(nutritionSchema).min(1),
  ingredients: z.array(
    z.object({
      group: z.string().optional(),
      raw: z.string(),
      quantity: z.number().optional(),
      unit: z.string().optional(),
      name: z.string().optional(),
      note: z.string().optional(),
    })
  ),
  steps: z.array(
    z.object({ phase: z.enum(['prep', 'cook']), body: z.string() })
  ),
  notes: z.array(
    z.object({
      kind: z.enum(['make_or_break', 'fixes', 'levers', 'tip']),
      body: z.string(),
    })
  ),
})

export type RecipeImport = z.infer<typeof recipeImportSchema>
```

Only `raw` is required on each ingredient, so imports work today and a parsing pass can fill `quantity`, `unit`, and `name` later.

**Seeding the existing recipes.** Run the book's markdown through the same flow once. An LLM pass converts each recipe to this JSON, and you check the nutrition rows against the book's tables before publishing.

**Direct push later.** An owner-only `importRecipe` GraphQL mutation lets the Claude web project send the JSON straight from the conversation, skipping the paste. The API is GraphQL only, so there is no REST import route. See [Roadmap](#roadmap-graphql-import-photos-and-the-automated-book).

## App structure and features

The public side is a filterable grid and a recipe page. The admin side is an editor and the import page. Filter state lives in the URL, so any filtered view is a link you can share.

| Route                                               | Purpose                                         |
| --------------------------------------------------- | ----------------------------------------------- |
| `/`                                                 | Recipe grid with filter bar and sort            |
| `/recipes/[slug]`                                   | Full recipe, servings scaler, comparison, notes |
| `/tags/[tag]`                                       | Pre-filtered grid for sharing and search        |
| `/login`                                            | Google sign-in                                  |
| `/admin`                                            | All recipes including drafts, publish toggle    |
| `/admin/recipes/new` and `/admin/recipes/[id]/edit` | Recipe editor                                   |
| `/admin/import`                                     | Paste JSON, validate, preview, save             |

**Filtering.** Protein minimum, calorie maximum, total time, cost tier, difficulty, tags, and text search over titles and ingredients. Queries run on the server from search params, backed by Postgres indexes and a generated `tsvector` column for search.

**Components (atomic design)**

- Atoms: `Badge`, `MacroPill`, `DifficultyDots`, `CostTier`
- Molecules: `NutritionTable`, `FilterChip`, `IngredientRow`, `ServingsStepper`
- Organisms: `RecipeCard`, `FilterBar`, `ComparisonTable`, `StepList`, `RecipeForm`
- Templates and pages: grid layout, recipe layout, admin layout

**Editing.** One `RecipeForm` built on React Hook Form and the shared Zod schema, with repeatable rows for ingredients, steps, and nutrition variants, and markdown fields for notes. A save writes a revision, then calls `revalidateTag` so the public page updates right away.

**Sharing.** Per-recipe preview images from `next/og` showing the title and macros, plus Open Graph tags, so links in texts and chats look good.

## Auth and access

Public read, owner-only write, enforced in the database and not only in the UI. Anyone can read published recipes. Only your account can create, edit, or publish.

- Supabase Auth with Google OAuth, sessions through `@supabase/ssr`, and middleware that redirects `/admin` to `/login`.
- Public sign-ups are turned off in the Supabase Auth settings, and your `users.role` is set to `admin`. RLS checks the role, so the app is not the only guard.
- RLS policies allow anonymous `select` on rows where `status = 'published'`, with child tables checked through their parent. `insert`, `update`, and `delete` are allowed only for owners, and drafts are visible only to the owner.
- Recipe reads and writes go through GraphQL and Drizzle on a server-side database connection, which bypasses RLS, so the resolvers check the owner. There is no service role key in the app.

**Paywall readiness** comes from one column. Each recipe has `access` (free by default). Later, a `subscriptions` table plus one extra RLS condition gates premium recipes without touching pages that already exist.

## Build milestones

Six milestones, roughly 5 to 7 focused days in total. Estimates are rough and assume you are comfortable with Next.js and new to Supabase.

| #   | Milestone       | Scope                                                                         | Done when                                                              | Estimate    |
| --- | --------------- | ----------------------------------------------------------------------------- | ---------------------------------------------------------------------- | ----------- |
| 1   | Foundation      | Next.js app, Tailwind, Supabase project, env vars, Vercel deploy, DNS         | Blank site is live on macromakeovers.com                               | 0.5 day     |
| 2   | Schema and RLS  | Migrations via Supabase CLI, generated types, seed tags, policies             | Anonymous read works and anonymous write is rejected                   | 0.5 day     |
| 3   | Import pipeline | Zod schema, `importRecipe`, CLI, admin paste page, seed the recipes           | All recipes render with macros matching the book                       | 1 day       |
| 4   | Read experience | Grid, filters, recipe page, servings scaler, comparison table, preview images | A shared link looks right and works well on a phone                    | 1 to 2 days |
| 5   | Admin editing   | Google login, route protection, editor, draft and publish, revisions          | You can fix a recipe from your phone and see it live in under a minute | 1 to 2 days |
| 6   | Polish          | SEO metadata, sitemap, analytics, 404 and empty states, nutrition disclaimer  | Ready to share widely                                                  | 0.5 day     |

The import pipeline comes before the UI on purpose. Once real recipes are in the database, every screen after that gets built and checked against real data.

## Future phases

Nothing here is built in phase 1, but the schema already carries what each phase needs.

| Phase                     | Adds                                                                                                                       | Already in place                                                                                             |
| ------------------------- | -------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| Accounts and paywall      | Stripe, `subscriptions` table, premium recipes, free previews                                                              | `access` column, RLS                                                                                         |
| Meal planning             | Plan builder, daily macro totals, merged grocery list, servings scaling                                                    | Per-serving nutrition, structured ingredients with category                                                  |
| Personalization           | Member profiles with goal weight, goal (balanced, fat loss, recomp, bulk), and protein grams, using the book's goal ratios | `users` table, ratios computed from macros                                                                   |
| Carb cycling and training | High and low carb day plans, lower-carb variants, training-day tagging                                                     | Nutrition variants and tags, so levers like the bulgogi rice cut or lettuce wraps import as swappable builds |
| Grocery ordering          | Instacart cart link built from the grocery list                                                                            | Normalized ingredient names and aisle categories                                                             |

For ordering, Instacart's developer platform fits a send-a-list, get-a-cart-link flow, but access is application-based, so check current terms before designing around it.

## Risks, open questions, and first steps

The biggest risk is ingredient parsing quality, and it only matters from meal planning onward, so phase 1 can ship on `raw_text` alone.

**Risks**

- **Ingredient parsing.** Free-text lines like "1.25 cups (~5oz) grated parmesan" need human review after an LLM parse. Keep `raw_text` as the display source and parse incrementally.
- **Supabase free tier.** Free projects can pause after inactivity and limits change, so check current terms before launch. ISR keeps cached public pages serving, and the paid plan is the fix if it becomes a problem.
- **Nutrition numbers are estimates.** Add a short disclaimer, and note they were tracked in MyFitnessPal.

**Open questions**

- Do you already own macromakeovers.com, and where is DNS managed?
- Do you want food photos at launch? The schema allows one image per recipe, with Supabase Storage as the later home.
- Slug style: `/recipes/blackened-chicken-alfredo` (the default) or numbered like the book?

**First steps**

1. Create the Supabase project and a Vercel project linked to a new repo.
2. Confirm the domain.
3. Next up is the SQL migration with RLS and the Zod import schema, so the first recipe imports end to end.

## Roadmap: GraphQL import, photos, and the automated book

The workflow: draft and refine a recipe in the Claude web project, send it to the site, get a placeholder photo, publish, and have the printable book rebuild itself. Tasks are in the order to work on them. Mark each one done here as it lands.

**Rule for all of it:** GraphQL only. Secrets (`OPENAI_API_KEY`, R2 keys, GitHub token) live in hosting env and GitHub secrets, never in the repo.

| #   | Task                         | Scope                                                                                                                                                                                                                                                                                                                          | Done when                                                                        |
| --- | ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------- |
| 1   | GraphQL import               | `importRecipe` mutation (with a `dryRun` flag and `overwrite`) on top of the existing `importRecipe` lib. Owner-only. Returns the field-level diff and import result. Add a `RecipeResolver` and schema types.                                                                                                                 | A signed-in owner can import a recipe from a GraphQL client and get the diff     |
| 2   | Non-browser auth             | Let a client that has no browser cookie authenticate as the owner (see below). Wire it into `createContext` so every owner-only resolver works.                                                                                                                                                                                | The Claude web project can call task 1 without you pasting or logging in by hand |
| 3   | Move admin writes to GraphQL | Admin import, publish, and edit currently use Next server actions. Move them to GraphQL mutations so there is one API. Keep thin server actions only if a form needs one.                                                                                                                                                      | No admin write path bypasses the GraphQL API                                     |
| 4   | Baseline book                | Install pandoc and Chromium locally (pandoc via `scoop install pandoc`), run `pnpm book:pdf`, keep the PDF as the format baseline.                                                                                                                                                                                             | A reference PDF exists to compare against                                        |
| 5   | Book from the DB             | `buildBook.ts` reads published recipes through `src/libs/recipes` and generates markdown in the shape of `docs/recipes.md`. The pandoc and `layoutRecipes` path stays untouched. Prose (intro, nutrition guidance) comes from `docs/`. The quick reference table is generated.                                                 | The DB-built book matches the baseline recipe by recipe, with any gaps listed    |
| 6   | R2 photos                    | After a new recipe imports with no `image_url`, a separate step generates a placeholder with OpenAI's image API from the title and summary, uploads it to Cloudflare R2, and writes the URL to `image_url`. Failure never fails the import. An overwrite never replaces an existing photo. Mark photos as placeholders.        | A new import ends up with a photo on its card and recipe page                    |
| 7   | Book photos from R2          | The book build downloads each recipe's `image_url`. `public/images` stays as the fallback for the original 14.                                                                                                                                                                                                                 | A recipe added through the API appears in the book with its photo                |
| 8   | Book workflow                | `.github/workflows/book.yml` installs pandoc and Chromium, runs `pnpm book:pdf`, and uploads the PDF to a rolling `recipe-book` GitHub Release. Triggers: push touching `docs/**`, `content/**`, or `public/images/**`, `workflow_dispatch`, and `repository_dispatch`. Use a concurrency group so quick edits make one build. | Merging a docs change rebuilds the release PDF                                   |
| 9   | Rebuild on DB edits          | A publish or edit through GraphQL fires `repository_dispatch` with a token that can only do that. Debounced.                                                                                                                                                                                                                   | Publishing a recipe updates the release PDF without you doing anything           |
| 10  | Docs                         | Update `importing-recipes.md` for the new flow and add a knowledge block for the Claude web project (schema plus an example recipe).                                                                                                                                                                                           | The web project produces JSON that imports cleanly                               |

### Order and parallel work

Each task lists what must be done first. Anything in the same wave can run at the same time (separate branches, separate agents).

| Task | Needs first | Wave |
| ---- | ----------- | ---- |
| 1    | none        | A    |
| 4    | none        | A    |
| 2    | 1           | B    |
| 3    | 1           | B    |
| 5    | 4           | B    |
| 6    | 1           | B    |
| 7    | 5, 6        | C    |
| 8    | 5           | C    |
| 9    | 1, 8        | D    |
| 10   | everything  | E    |

```text
1 ──┬── 2
    ├── 3
    ├── 6 ──┐
    │       ├── 7
4 ── 5 ─────┤
            └── 8 ── 9 ── 10
(1 also feeds 9)
```

- Longest chains (5 steps each): 1 → 6 → 7 → 9 → 10 and 4 → 5 → 8 → 9 → 10. Start both early.
- Task 4 needs pandoc and Chromium on a machine that has them, so it is a local task, not a remote-session one.
- Tasks 2 and 3 both touch `createContext` and the resolver layer. Expect to rebase one on the other.
- Task 2's auth choice depends on whether the Claude web project can make outbound HTTPS calls. Verify that before building.
- Task 6 needs `OPENAI_API_KEY` and R2 credentials, so it can only be tested end to end where those secrets exist.
- Tasks 1, 2 and 3 are in progress in PR #32 (GraphQL import and MCP connector). Check it before starting any of them.

**Auth options for task 2 (undecided).** The Claude web UI cannot hold your browser session, and Playwright is not available there. The realistic options:

1. **Owner API token (recommended first).** A long-random token you generate in the admin, stored hashed in the database, sent as `Authorization: Bearer`. `createContext` resolves it to the owner. It can be revoked and scoped to the import and publish mutations only. This needs the web project to be able to make outbound HTTP calls, which depends on its network settings. Verify that before building.
2. **Your Supabase session token.** The JWT from signing in on the site works as a bearer token, but it expires in about an hour and needs a refresh token to renew. Fine for testing, annoying as the real flow.
3. **Remote MCP server with OAuth.** Expose the import and publish mutations as an MCP connector, with Google sign-in through Supabase for the OAuth step. This is the cleanest way for the Claude web UI to authenticate you, and it needs no token to paste. It is more work, so treat it as a follow-up to option 1.

## Decisions since this plan was written

- The book now has 12 recipes, and all 12 are seeded in milestone 3 (see [recipes.md](./recipes.md)).
- The repo is built on the `nextjs-graphql-template` Supabase variant, bootstrapped with `database`, `auth`, and `email`. Realtime and file uploads were left out for now.
- Images: Cloudflare R2 replaces Supabase Storage as the plan. New recipes get an AI-generated placeholder photo (see the roadmap).
- The API is GraphQL only. No REST endpoints are added. `/auth/callback` stays a route handler because Supabase's OAuth redirect requires one.
- Steps get an optional `durationMinutes` so a later cook mode can run per-step timers without a migration.
- The recipe book also holds material for content pages (about, nutrition guide, shopping guide). Proposed: keep them as MDX in the repo, not in the database. Not yet decided.
