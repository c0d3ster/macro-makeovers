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

| Table                 | Key columns                                                                                                                                          | Notes                                                                                          |
| --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| `recipes`             | `id`, `slug`, `title`, `summary`, `servings`, `prep_minutes`, `cook_minutes`, `cost_tier` (1-4), `difficulty` (1-5), `status`, `access`, `image_url` | `status` is draft or published. `access` defaults to free and is the later paywall hook.       |
| `recipe_nutrition`    | `recipe_id`, `kind` (makeover or traditional), `label`, `is_default`, `calories`, `carbs_g`, `fat_g`, `protein_g`                                    | Ratio is computed, not stored. Drives the comparison component.                                |
| `ingredients`         | `recipe_id`, `group_name`, `position`, `raw_text`, `quantity`, `unit`, `name`, `note`, `category`                                                    | `raw_text` is the display source of truth. Parsed fields feed scaling and grocery lists later. |
| `steps`               | `recipe_id`, `phase` (prep or cook), `position`, `body_md`                                                                                           | Ordered per recipe.                                                                            |
| `recipe_notes`        | `recipe_id`, `kind` (make_or_break, fixes, levers, tip), `position`, `body_md`                                                                       | Holds the book's make-or-break, fixes, and levers sections.                                    |
| `tags`, `recipe_tags` | `name`, `kind` (category, method, attribute)                                                                                                         | For example pasta, air fryer, freezer friendly, high protein.                                  |
| `recipe_revisions`    | `recipe_id`, `snapshot` (jsonb), `created_at`                                                                                                        | One snapshot per save, so edits are reversible.                                                |
| `profiles`            | `user_id`, `role` (owner or member)                                                                                                                  | Role check used by RLS.                                                                        |

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
  costTier: z.number().int().min(1).max(4),
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

**Direct push later.** A token-protected route handler (`POST /api/admin/import`) lets Claude Code send the JSON straight from the conversation, skipping the paste.

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
- Public sign-ups are turned off in the Supabase Auth settings, and your `profiles.role` is set to `owner`. RLS checks the role, so the app is not the only guard.
- RLS policies allow anonymous `select` on rows where `status = 'published'`, with child tables checked through their parent. `insert`, `update`, and `delete` are allowed only for owners, and drafts are visible only to the owner.
- The import route and CLI use the service role key, kept server-side and never shipped to the browser.

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

| Phase                     | Adds                                                                                                                            | Already in place                                                                                             |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| Accounts and paywall      | Stripe, `subscriptions` table, premium recipes, free previews                                                                   | `access` column, RLS                                                                                         |
| Meal planning             | Plan builder, daily macro totals, merged grocery list, servings scaling                                                         | Per-serving nutrition, structured ingredients with category                                                  |
| Personalization           | Member profiles with bodyweight, goal (recomp or clean bulk), and protein target, using the book's 45/25/30 and 40/30/30 ratios | `profiles` table, ratios computed from macros                                                                |
| Carb cycling and training | High and low carb day plans, lower-carb variants, training-day tagging                                                          | Nutrition variants and tags, so levers like the bulgogi rice cut or lettuce wraps import as swappable builds |
| Grocery ordering          | Instacart cart link built from the grocery list                                                                                 | Normalized ingredient names and aisle categories                                                             |

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

## Decisions since this plan was written

- The book now has 12 recipes, and all 12 are seeded in milestone 3 (see [recipes.md](./recipes.md)).
- The repo is built on the `nextjs-graphql-template` Supabase variant, bootstrapped with `database`, `auth`, and `email`. Realtime and file uploads were left out for now.
- Images are deferred. Supabase Storage is the plan when the time comes.
- Steps get an optional `durationMinutes` so a later cook mode can run per-step timers without a migration.
- The recipe book also holds material for content pages (about, nutrition guide, shopping guide). Proposed: keep them as MDX in the repo, not in the database. Not yet decided.
