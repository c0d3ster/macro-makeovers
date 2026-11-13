# Macro Makeovers

High-protein, lower-fat versions of foods people love. Comfort-food staples rebuilt ingredient by
ingredient to keep the flavor while cutting the fat and adding protein, with the original dish's
numbers next to every recipe so you can see the difference. Why the project exists is in
[content/guides/about.md](content/guides/about.md), which is also the
site's About page.

Live at [macromakeovers.com](https://macromakeovers.com). The same recipes also ship as a printable
PDF book, rebuilt automatically when a published recipe changes.

## What's in here

- **Recipe site**: browse and filter recipes by tag and macro fit (`/`), read a recipe with its
  traditional vs. makeover nutrition (`/recipes/[slug]`), and browse by tag (`/tags/[tag]`). A
  recipe can have several builds (versions that share its method, picked from the nutrition
  table), and dishes link the sides and sauces they use. Each recipe page has its own share image
  with its calories and C/F/P split.
- **Basket**: pick recipes for the week and get one pooled shopping list with the trip cost
  (`/basket`).
- **Guides**: the nutrition, shopping, and recipe reading guides (`/guides`) and the About page
  (`/about`).
- **Admin**: the site owner can import, edit, publish, and unpublish recipes at `/admin`.
- **Claude connector**: `/api/mcp` is a remote MCP server, so recipes can be read, validated,
  and imported straight from a Claude chat.
- **Photos**: uploaded or generated (OpenAI image API) in the recipe editor, stored in Cloudflare
  R2.
- **Recipe book**: built from the published recipes and published to the `recipe-book` release
  by a GitHub workflow whenever the book's contents change.

## Roadmap

Next up, roughly in order. Each has a PRD in [docs/prd](docs/prd/README.md) with scope, data, and
open questions.

1. **Accounts and subscription**: sign-up and the gate for paid features.
2. **Personalization**: set your goal once and the site highlights the recipes that fit it.
3. **Ingredient normalization**: one shared ingredient list, needed by the planner and grocery list.
4. **Meal planner**: build a week of meals that hits your targets.
5. **Grocery list and ordering**: turn a plan into a shopping list and a cart.
6. **Reviews**: ratings and notes on recipes.

## How it works

- The hosted database is the source of truth. Recipes come in through the admin page, the Claude
  connector, or the CLI, and every path goes through one function, `importRecipe` in
  `src/libs/recipes`, which validates against the shared Zod schema and upserts by slug. New
  recipes land as drafts.
- Pages read recipes on the server through loaders that call `RecipeService` directly, so recipe
  pages build ahead of time. Writes go through GraphQL mutations that only the site owner can call.
- Drizzle connects as the database owner and bypasses row-level security, so services check access
  themselves. RLS stays on every table as a backstop.
- Publishing, unpublishing, or editing a published recipe asks GitHub to rebuild the book, which
  reads the published recipes straight from the database.

The full flow, including the connector setup and the book build, is in
[docs/importing-recipes.md](docs/importing-recipes.md).

## Tech stack

- Next.js (App Router), React, TypeScript, Tailwind CSS
- Supabase Postgres and Auth (email/password and Google), Drizzle ORM for queries
- GraphQL (Apollo Server with type-graphql, Apollo Client) for writes
- Cloudflare R2 for photos, Resend for email, Vercel for hosting and analytics
- Vitest and Playwright for tests

## Local development

Needs Node 20+, pnpm (`corepack enable`), and [Docker](https://docs.docker.com/get-docker/) for the
local Supabase stack.

1. **Install:**

   ```bash
   pnpm install
   pnpm exec lefthook install   # lint, type, and commit message checks on commit
   ```

2. **Start the local database:**

   ```bash
   pnpm db:start
   ```

   This boots Postgres, Auth, and Studio (<http://127.0.0.1:54323>) and applies
   `supabase/migrations`. Stop it with `pnpm db:stop`, or rebuild it from the migrations with
   `pnpm db:reset`.

3. **Set up the environment:** `.env` holds committed, non-secret defaults that already point at
   the local stack. Put anything secret in `.env.local` (git-ignored), using `.env.example` as the
   list. At minimum, copy the publishable key from `pnpm exec supabase status`:

   ```bash
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
   ```

   Optional keys turn on extra features: `OPENAI_API_KEY` and the `R2_*` values for placeholder
   photos, `GITHUB_DISPATCH_TOKEN` for automatic book rebuilds, and `RESEND_API_KEY` for email.

4. **Load the seed recipes:**

   ```bash
   pnpm recipe:import content/recipes --publish
   ```

   The 16 seed recipes in `content/recipes` give a fresh local database something to show. They
   are a fixed snapshot and don't need to track the hosted database.

5. **Run it:**

   ```bash
   pnpm dev
   ```

Email and password sign-in works with no extra setup. Google sign-in, the hosted database, and
Vercel are covered in [docs/deployment.md](docs/deployment.md).

### Database changes

Migrations are plain SQL in `supabase/migrations`. Create one with `pnpm db:new <name>` and apply
it with `pnpm db:reset`. Drizzle is used for queries only: after a schema change, run `pnpm db:pull`
and port the result into `src/models`. Enable row-level security on every new table, and still
check access in `src/services`, since Drizzle bypasses it.

### Scripts

| Script                                                    | What it does                                         |
| --------------------------------------------------------- | ---------------------------------------------------- |
| `pnpm dev`                                                | Dev server plus GraphQL codegen watch                |
| `pnpm build` / `pnpm start`                               | Production build and server                          |
| `pnpm test` / `pnpm test:e2e`                             | Vitest unit tests / Playwright end-to-end tests      |
| `pnpm lint` / `pnpm check:types` / `pnpm check:deps`      | ESLint / TypeScript / unused code and deps (knip)    |
| `pnpm codegen`                                            | Regenerate GraphQL types                             |
| `pnpm db:start` / `db:stop` / `db:reset`                  | Local Supabase stack                                 |
| `pnpm db:new <name>` / `db:push` / `db:pull` / `db:types` | Migrations, hosted push, Drizzle and Supabase types  |
| `pnpm recipe:import` / `recipe:import:prod`               | Import recipe JSON into the local / hosted DB        |
| `pnpm book:pdf` / `book:pdf:prod`                         | Build the recipe book PDF from the local / hosted DB |
| `pnpm photos:backfill` / `photos:backfill:prod`           | Point the seed recipes at their R2 photos            |

The book build needs `pandoc` on the PATH and Playwright's Chromium
(`pnpm exec playwright install chromium`).

### Project structure

```
content/
├── recipes/          # Seed recipe JSON for a fresh local database
├── book/             # Book intro and recipe order
└── guides/           # About and guide prose, shared by the site and the book
docs/                 # Import and deployment how-tos, PRDs, cost data
scripts/              # Recipe import, book build, photo backfill
supabase/             # Local stack config and SQL migrations
src/
├── app/
│   ├── (public)/     # Home, recipes, tags, basket, guides, about, login
│   ├── (admin)/      # Owner-only recipe import and editor
│   ├── (auth)/       # Signed-in pages (profile)
│   └── api/          # GraphQL and MCP endpoints
├── components/       # Atomic design: atoms, molecules, organisms, templates
├── graphql/          # Schema, resolvers, context
├── services/         # Business logic and access checks
├── libs/             # Recipes, photos, MCP, book rebuild, DB, env
├── models/           # Drizzle schema
└── validations/      # Zod schemas, including the recipe import schema
```

## Docs

- [About](content/guides/about.md): why the project exists
- [Importing recipes](docs/importing-recipes.md): import paths, Claude connector, photos, the book
- [Deployment](docs/deployment.md): hosted Supabase, Vercel, Google sign-in
- [PRDs](docs/prd/README.md): what's next and in what order
- [Guides](content/guides): the nutrition, shopping, and recipe reading guides. The site shows
  them under /guides and the book prints them, so one edit changes both.

## Contributing

Commits follow Conventional Commits. Lefthook runs lint and type checks on commit, and CI runs the
dependency check and tests on every PR to `main`. Project conventions for agents and humans are in
[AGENTS.md](AGENTS.md).
