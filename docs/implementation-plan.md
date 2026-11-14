# Macro Makeovers Site: Implementation Plan

Oct 18, 2026 · @c0d3ster · status updated Nov 12, 2026

**Status:** phase 1 is done and live on macromakeovers.com. Since then the site has added builds, courses and components, goal filters, guide pages, and the basket. What's next is under [Next steps](#risks-open-questions-and-next-steps).

## Goals and scope

Phase 1 is a free, public recipe site on macromakeovers.com where you can view, filter, add, and edit recipes, with a one-step import from the agent conversations you already use to build them.

**In scope**

- Browse and filter recipes by protein, calories, cook time, cost, difficulty, and tags
- Recipe pages with a servings scaler, nutrition, and a makeover vs traditional comparison
- Owner-only add and edit, with draft and publish
- Import from an agent conversation as validated JSON
- Clean share links with preview cards, built for phone viewing

**Deferred**

Subscriptions, paywall, meal planning, goal-based personalization, carb cycling, and grocery ordering. Ingredients are stored in structured form from day one, so none of those later phases need a data migration. Goal filters (including carb cycling days) and the basket have since shipped as free features, without accounts.

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
| Images         | Cloudflare R2                                | Owner uploads and AI placeholder photos, per recipe and build |
| Analytics      | Vercel Analytics                             | Page views with no extra setup                             |

Public pages are statically generated and revalidated by path (`revalidatePath`) whenever you save an edit, so cached pages keep serving even if the database is briefly unavailable.

## Data model

One `recipes` table with child tables for everything that repeats. Makeover macros are stored per build, so "fully loaded" chili and the rice bowl griller are builds, and every traditional comparison is a nutrition row, not a special case.

| Table                 | Key columns                                                                                                                                                                                    | Notes                                                                                          |
| --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| `recipes`             | `id`, `slug`, `title`, `summary`, `servings`, `serving_size`, `makes`, `prep_minutes`, `cook_minutes`, `cost_tier` (1-5), `variant_of` (optional, the base recipe), `difficulty` (1-5), `course`, `status`, `access`, `image_url`, `image_is_placeholder` | `status` is draft or published. `access` defaults to free and is the later paywall hook. `course` is breakfast, appetizer, main (default), side, or sauce. |
| `recipe_builds`       | `recipe_id`, `key`, `label`, `position`, `is_default`, `listed`, `calories`, `carbs_g`, `fat_g`, `protein_g`, plus optional overrides: `swap`, `title`, `note_md`, `cost_tier`, `difficulty`, `prep_minutes`, `cook_minutes`, `course`, `image_url` | Versions of one recipe that share its method. Exactly one default. Ratio is computed, not stored. |
| `recipe_nutrition`    | `recipe_id`, `kind`, `label`, `position`, `calories`, `carbs_g`, `fat_g`, `protein_g`                                                                                                         | Only the traditional comparison rows. Makeover rows moved to builds.                           |
| `recipe_components`   | `recipe_id`, `component_id`, `position`, `amount`, `note_md`, `servings_per_serving`, `component_build`, `only_builds`, `skip_builds`                                                          | A side or sauce a dish uses, shown inline in its ingredients. One level deep.                  |
| `ingredients`         | `recipe_id`, `group_name`, `position`, `raw_text`, `quantity`, `unit`, `name`, `note`, `category`, `only_builds`, `skip_builds`                                                                | `raw_text` is the display source of truth. Parsed fields feed scaling and grocery lists later. |
| `steps`               | `recipe_id`, `phase` (prep or cook), `position`, `body_md`, `duration_minutes`, `only_builds`, `skip_builds`                                                                                   | Ordered per recipe.                                                                            |
| `recipe_notes`        | `recipe_id`, `kind` (make_or_break, fixes, levers, tip, nutrition_intro, nutrition_analysis), `position`, `body_md`, `only_builds`, `skip_builds`                                              | Holds the book's make-or-break, fixes, and levers sections.                                    |
| `tags`, `recipe_tags` | `name`, `kind` (category, method, attribute)                                                                                                                                                   | For example pasta, air fryer, freezer friendly, high protein.                                  |
| `recipe_revisions`    | `recipe_id`, `snapshot` (jsonb), `created_at`                                                                                                                                                  | One snapshot per save, so edits are reversible.                                                |
| `users`               | `auth_id`, `email`, `role` (client, developer, admin, or super_admin; admin and super_admin are the owner)                                                                                     |

Whole-batch rows and C/F/P ratios from the book are derived from per-serving values and servings, so they are not stored. `only_builds` and `skip_builds` scope a row to some builds, and empty on both means every build.

## Import pipeline

Every recipe enters the database through one function, `importRecipe`, which validates a JSON payload against a shared Zod schema and upserts it by slug. New recipes land as drafts. The CLI, the admin paste page, the editor, and the Claude connector all call it.

1. At the end of a recipe conversation, a skill or saved prompt has the agent emit the final recipe as one JSON block in the schema below.
2. Paste it into `/admin/import`, or run `pnpm recipe:import path/to/recipe.json`.
3. Validation runs. Errors name the exact field, so you fix the JSON or ask the agent to correct it.
4. A new slug lands as a draft. An existing slug shows a field-level diff and needs an explicit overwrite.
5. Review the draft in the editor, then publish.

A trimmed sketch of the schema. The real one, with every field and rule, is `recipeImportSchema` in `src/validations/RecipeImportValidation.ts`.

```ts
const macros = { calories, carbsG, fatG, proteinG } // per serving
const buildScope = { onlyBuilds: z.array(key).optional(), skipBuilds: z.array(key).optional() }

export const recipeImportSchema = z.object({
  slug, title, summary,
  servings: z.number().int().positive(),
  servingSize: z.string().optional(), // "1/2 cup", mostly for sides and sauces
  makes: z.string().optional(), // "2.5 cups"
  prepMinutes, cookMinutes,
  costTier: tier, // 1-5
  difficulty: tier, // 1-5
  course: z.enum(['breakfast', 'appetizer', 'main', 'side', 'sauce']).default('main'),
  variantOf: slug.optional(),
  tags: z.array(z.string()),
  builds: z.array(z.object({
    key, label, isDefault, listed, ...macros,
    swap, title, note, costTier, difficulty, prepMinutes, cookMinutes, course, // optional overrides
  })),
  nutrition: z.array(z.object({ kind, label, ...macros })), // traditional rows; old makeover rows import as builds
  ingredients: z.array(z.object({ group, raw, quantity, unit, name, note, ...buildScope })).min(1),
  steps: z.array(z.object({ phase: z.enum(['prep', 'cook']), body, durationMinutes, ...buildScope })).min(1),
  notes: z.array(z.object({ kind, body, ...buildScope })),
  components: z.array(z.object({ slug, amount, servingsPerServing, build, note, ...buildScope })),
})
```

Only `raw` is required on each ingredient, so imports work today and a parsing pass can fill `quantity`, `unit`, and `name` later.

**Seeding the existing recipes.** Run the book's markdown through the same flow once. An LLM pass converts each recipe to this JSON, and you check the nutrition rows against the book's tables before publishing.

**Direct push.** An owner-only `importRecipe` GraphQL mutation, plus the Claude connector (an MCP server at `/api/mcp` with `get_recipe_schema`, `get_recipe`, `validate_recipe`, and `import_recipe`), lets a Claude conversation send the JSON straight in, skipping the paste. See [importing-recipes.md](./importing-recipes.md).

## App structure and features

The public side is a home page, a filterable grid, recipe pages, guides, and the basket. The admin side is an editor and the import page. Filter state lives in the URL, so any filtered view is a link you can share.

| Route                                               | Purpose                                         |
| --------------------------------------------------- | ----------------------------------------------- |
| `/`                                                 | Home: featured recipes, goals, recipes to cook together |
| `/recipes`                                          | Recipe grid with filter bar and sort, sides and sauces below |
| `/recipes/[slug]`                                   | Full recipe, build switcher (`?build=`), servings scaler, comparison, notes |
| `/tags/[tag]`                                       | Pre-filtered grid for sharing and search        |
| `/guides` and `/guides/[slug]`                      | Nutrition, shopping, and reading-recipes guides |
| `/about`                                            | The project's why, and a form to suggest a dish for a makeover |
| `/basket`                                           | Pooled shopping list, trip cost, and savings    |
| `/login` and `/profile`                             | Google sign-in and the account page             |
| `/admin`                                            | All recipes including drafts, publish toggle    |
| `/admin/recipes/new` and `/admin/recipes/[id]/edit` | Recipe editor, with builds, components, and photos |
| `/admin/recipes/[id]/preview`                       | Owner preview of a draft                        |
| `/admin/import`                                     | Paste JSON, validate, preview, save             |
| `/oauth/consent`                                    | Approves an OAuth client, like the Claude connector |

**Filtering.** Goal (seven, including carb cycling low and high days), macro targets, calorie maximum, total time, cost tier, difficulty, meat, method, dish, good-for tags, and text search. Goals and macro targets rank and tag recipes and never hide any. Filters are read from search params on the server, and the grid shows each recipe's best-fitting build.

**Components (atomic design)**

- Atoms: `Badge`, `MacroPill`, `MacroDonut`, `DifficultyDots`, `CostTier`
- Molecules: `ServingsStepper`, `ComponentDisclosure`, `AddToBasketButton`
- Organisms: `RecipeCard`, `CompactRecipeCard`, `FilterBar`, `NutritionTable` (builds plus the traditional comparison), `ScalableIngredients`, `StepList`, `BasketView`, `RecipeForm`
- Templates and pages: grid layout, recipe layout, admin layout

**Editing.** One `RecipeForm` built on React Hook Form and the shared Zod schema, with repeatable rows for ingredients, steps, builds, and components, build scoping per row, and markdown fields for notes. A save goes through `importRecipe`, writes a revision, then revalidates the public pages so they update right away.

**Sharing.** Per-recipe preview images from `next/og` showing the title and macros, plus Open Graph tags, so links in texts and chats look good.

## Auth and access

Public read, owner-only write, enforced in the database and not only in the UI. Anyone can read published recipes. Only your account can create, edit, or publish.

- Supabase Auth with Google OAuth, sessions through `@supabase/ssr`, and a proxy (`src/proxy.ts`, Next's renamed middleware) that redirects `/admin` and `/profile` to `/login`.
- Public sign-ups are on, with Google or email and password (email needs a confirmation link). New accounts get the `client` role, and your `users.role` is `super_admin`. RLS checks the role, so the app is not the only guard.
- RLS policies allow anonymous `select` on rows where `status = 'published'`, with child tables checked through their parent. `insert`, `update`, and `delete` are allowed only for owners, and drafts are visible only to the owner.
- Pages read recipes on the server through `RecipeService`, and writes go through GraphQL mutations. Both use Drizzle on a server-side database connection, which bypasses RLS, so the services and resolvers check the owner. There is no service role key in the app.

**Paywall readiness** comes from one column. Each recipe has `access` (free by default). Later, a `subscriptions` table plus one extra RLS condition gates premium recipes without touching pages that already exist.

## Build milestones

Six milestones, roughly 5 to 7 focused days in total. Estimates are rough and assume you are comfortable with Next.js and new to Supabase. All six are done.

| #   | Milestone       | Scope                                                                         | Done when                                                              | Estimate    | Status |
| --- | --------------- | ----------------------------------------------------------------------------- | ---------------------------------------------------------------------- | ----------- | ------ |
| 1   | Foundation      | Next.js app, Tailwind, Supabase project, env vars, Vercel deploy, DNS         | Blank site is live on macromakeovers.com                               | 0.5 day     | Done   |
| 2   | Schema and RLS  | Migrations via Supabase CLI, generated types, seed tags, policies             | Anonymous read works and anonymous write is rejected                   | 0.5 day     | Done   |
| 3   | Import pipeline | Zod schema, `importRecipe`, CLI, admin paste page, seed the recipes           | All recipes render with macros matching the book                       | 1 day       | Done   |
| 4   | Read experience | Grid, filters, recipe page, servings scaler, comparison table, preview images | A shared link looks right and works well on a phone                    | 1 to 2 days | Done   |
| 5   | Admin editing   | Google login, route protection, editor, draft and publish, revisions          | You can fix a recipe from your phone and see it live in under a minute | 1 to 2 days | Done   |
| 6   | Polish          | SEO metadata, sitemap, analytics, 404 and empty states                        | Ready to share widely                                                  | 0.5 day     | Done   |

The import pipeline comes before the UI on purpose. Once real recipes are in the database, every screen after that gets built and checked against real data.

## Future phases

None of these were built in phase 1, and the schema carries what each needs. Parts have shipped since, as the table notes. The PRDs in [prd/](./prd/README.md) hold the current scope and order.

| Phase                     | Adds                                                                                                                       | Already in place                                                                                             |
| ------------------------- | -------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| Accounts and paywall      | Stripe, `subscriptions` table, premium recipes, free previews                                                              | `access` column, RLS                                                                                         |
| Meal planning             | Plan builder, daily macro totals, merged grocery list, servings scaling                                                    | Per-serving nutrition, structured ingredients. The basket already merges recipes into one priced list with servings per recipe, saved in the browser |
| Personalization           | Member profiles with goal weight, goal (balanced, fat loss, recomp, bulk), and protein grams, using the book's goal ratios | `users` table, ratios computed from macros. Goal filters on `/recipes` rank recipes by fit, with no account   |
| Carb cycling and training | High and low carb day plans, lower-carb variants, training-day tagging                                                     | Builds with their own macros, plus carb cycling low and high day goals in the filters                        |
| Grocery ordering          | Send to cart from the basket, to a grocer the user picks                                                                   | Basket lines with pack sizes and store sections. Grocer options are in [grocery-services.md](./grocery-services.md) |

For ordering, the plan is multi-grocer: the user picks the grocer, and Instacart is one option, not the only one. See [prd/05-grocery-ordering.md](./prd/05-grocery-ordering.md).

## Risks, open questions, and next steps

The biggest risk is ingredient parsing quality, and it only matters from meal planning onward, so phase 1 can ship on `raw_text` alone.

**Risks**

- **Ingredient parsing.** Free-text lines like "1.25 cups (~5oz) grated parmesan" need human review after an LLM parse. Keep `raw_text` as the display source and parse incrementally.
- **Supabase free tier.** Free projects can pause after inactivity and limits change, so check current terms before launch. ISR keeps cached public pages serving, and the paid plan is the fix if it becomes a problem.
- **Nutrition numbers are estimates.** They were tracked in MyFitnessPal. The site shows no disclaimer.

**Open questions (resolved)**

- The domain is macromakeovers.com, live on Vercel.
- Photos: every recipe and build can have one, on Cloudflare R2, with an AI placeholder until a real photo is uploaded.
- Slugs are words, like `/recipes/blackened-chicken-alfredo`, not book numbers.

**First steps (done)**

1. Create the Supabase project and a Vercel project linked to a new repo.
2. Confirm the domain.
3. Write the SQL migration with RLS and the Zod import schema, so the first recipe imports end to end.

**Next steps**

Roughly in order, from [prd/README.md](./prd/README.md):

1. Accounts and subscription (PRD 01): the subscription and the gate for paid features. Sign-up is already live.
2. Personalization (PRD 02): a saved goal that highlights the recipes that fit it.
3. Ingredient normalization (PRD 03): one shared ingredient list, so basket lines follow recipe edits instead of the hand-kept `src/libs/basket/basketData.ts`.
4. Meal planner (PRD 04), then grocery ordering and Send to cart (PRD 05).
5. Favorites and reviews (PRD 06), and launch and advertising (PRD 07).
6. The rest of builds (PRD 09), so filters and the basket use every build, not only the default.

## Decisions since this plan was written

- The book's recipes were all seeded in milestone 3 (see [recipes.md](./recipes.md)). `content/recipes` now holds 16 seed files for a fresh local database, 14 dishes plus 2 sauces. The hosted database is the source of truth.
- The repo is built on the `nextjs-graphql-template` Supabase variant, bootstrapped with `database`, `auth`, and `email`. Realtime and the template's file uploads were left out. Photos upload to R2 instead.
- Images: Cloudflare R2 replaces Supabase Storage. New recipes get an AI-generated placeholder photo, and the owner can upload or generate photos from the editor (see [importing-recipes.md](./importing-recipes.md)).
- The API is GraphQL only for recipe data. The other route handlers are `/auth/callback` (Supabase's OAuth redirect needs one), the Claude connector at `/api/mcp` with its OAuth routes, and the admin photo routes under `/api/admin`.
- Steps get an optional `durationMinutes` so a later cook mode can run per-step timers without a migration.
- Content pages are markdown in the repo, not in the database. `content/guides` holds the about, nutrition, shopping, and reading-recipes prose, shared by `/about`, `/guides`, and the printable book.
- The printable book is built from the published recipes in the database, not from `docs/recipes.md`. The roadmap that got it there (GraphQL import, owner auth, R2 photos, the book workflow, rebuild on publish) is done, and its how-to lives in [importing-recipes.md](./importing-recipes.md).
- The site has a 404 page, and the nutrition disclaimer on recipe pages is removed.
- Builds replace makeover nutrition rows. A build carries its own macros and can swap tags, retitle the recipe, and scope lines, steps, and notes. The makeover rows and `is_default` were dropped from `recipe_nutrition` (see [prd/09-builds.md](./prd/09-builds.md)).
- Recipes have a course, and `recipe_components` links a dish to the sides and sauces it uses. The corn pico and the mango habanero salsa are their own recipes now.
- The basket shipped early as a free feature: pooled packs, smallest-pack costing, per-build lines, and servings per recipe. Its prices live in `src/libs/basket/basketData.ts` (see [shopping-list-data.md](./shopping-list-data.md)).
