# Macro Makeovers

High-protein, lower-fat versions of foods people love. Comfort-food staples rebuilt ingredient by
ingredient to keep the flavor while cutting the fat and adding protein, with the original dish's
numbers next to every recipe so you can see the difference.

Live at [macro-makeovers.vercel.app](https://macro-makeovers.vercel.app). The same recipes also
ship as a printable PDF book, rebuilt automatically when a published recipe changes. The thinking
behind the book is in [docs/about.md](docs/about.md).

## What's in here

- **Recipe site**: browse and filter recipes by tag and macro fit (`/`), read a recipe with its
  traditional vs. makeover nutrition (`/recipes/[slug]`), and browse by tag (`/tags/[tag]`). Each
  recipe page has its own share image with its calories and C/F/P split.
- **Admin**: the site owner can import, edit, publish, and unpublish recipes at `/admin`.
- **Claude connector**: `/api/mcp` is a remote MCP server, so recipes can be validated and
  imported straight from a Claude chat.
- **Photos**: a new recipe with no photo gets a generated placeholder (OpenAI image API), stored
  in Cloudflare R2.
- **Recipe book**: `pnpm book:pdf` builds the PDF from the published recipes, and a GitHub
  workflow publishes it to the `recipe-book` release.

## Tech stack

- Next.js (App Router), React, TypeScript, Tailwind CSS
- Supabase Postgres and Auth (email/password and Google), Drizzle ORM for queries
- GraphQL (Apollo Server with type-graphql, Apollo Client) for writes
- Cloudflare R2 for photos, Resend for email, Vercel for hosting and analytics
- Vitest and Playwright for tests

## How it fits together

- Recipe content starts as JSON (`content/recipes/*.json`) or comes in through the admin page or
  the Claude connector. Every path goes through one function, `importRecipe` in `src/libs/recipes`,
  which validates against the shared Zod schema and upserts by slug. New recipes land as drafts.
- Pages read recipes on the server through loaders that call `RecipeService` directly, so recipe
  pages build ahead of time. Writes go through GraphQL mutations that only the site owner can call.
- Drizzle connects as the database owner and bypasses row-level security, so services check access
  themselves. RLS stays on every table as a backstop.

The full flow, including the connector setup and the book build, is in
[docs/importing-recipes.md](docs/importing-recipes.md).

## Getting started

Needs Node 20+, pnpm (`corepack enable`), and [Docker](https://docs.docker.com/get-docker/) for the
local Supabase stack.

1. **Install:**

   ```bash
   pnpm install
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
   pnpm recipe:import
   ```

   They import as drafts. Publish them from `/admin` once you're signed in as the owner.

5. **Run it:**

   ```bash
   pnpm dev
   ```

### Google sign-in (local)

Google is enabled in `supabase/config.toml`, but "Continue with Google" errors until you add
credentials. Create an OAuth client in Google Cloud Console (Web application) with the redirect URI
`http://127.0.0.1:54321/auth/v1/callback`, then create `supabase/.env` (git-ignored, never commit
it) and restart with `pnpm db:stop && pnpm db:start`:

```bash
SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID=<client id>
SUPABASE_AUTH_EXTERNAL_GOOGLE_SECRET=<client secret>
```

Email and password sign-in works locally with no extra setup.

## Database

Migrations are plain SQL in `supabase/migrations`. Create one with `pnpm db:new <name>` and apply
it with `pnpm db:reset`. Drizzle is used for queries only: after a schema change, run `pnpm db:pull`
and port the result into `src/models`.

Enable row-level security on every new table. Drizzle bypasses it, so every query in
`src/services` still has to check access itself.

## Deployment

The site runs on Vercel, with environment variables set in the Vercel project. Production uses a
hosted Supabase project:

```bash
pnpm exec supabase login
pnpm exec supabase link --project-ref <project-ref>
pnpm db:push
```

- `NEXT_PUBLIC_SUPABASE_URL` is `https://<project-ref>.supabase.co`, and the keys come from
  Dashboard → Project Settings → API Keys.
- `DATABASE_URL` uses the transaction pooler (port 6543) at runtime and the direct or session
  connection (port 5432) for `db:pull`. Set it for the build too, since recipe pages are built
  ahead of time.
- `NEXT_PUBLIC_APP_URL` is the public site URL. Share images, the sitemap, and the Claude
  connector are built from it.
- For hosted Google sign-in, use `https://<project-ref>.supabase.co/auth/v1/callback` as the
  redirect URI, enable the Google provider in Supabase, and add your site's `/auth/callback` to
  the allowed redirect URLs.

Import recipes into the hosted database with `pnpm recipe:import:prod`, which reads
`.env.production` and `.env.production.local`.

## Scripts

| Script                                                    | What it does                                         |
| --------------------------------------------------------- | ---------------------------------------------------- |
| `pnpm dev`                                                | Dev server plus GraphQL codegen watch                |
| `pnpm build` / `pnpm start`                               | Production build and server                          |
| `pnpm test` / `pnpm test:e2e`                             | Vitest unit tests / Playwright end-to-end tests      |
| `pnpm lint` / `pnpm check:types` / `pnpm check:deps`      | ESLint / TypeScript / unused code and deps (knip)    |
| `pnpm codegen`                                            | Regenerate GraphQL types                             |
| `pnpm db:start` / `db:stop` / `db:reset`                  | Local Supabase stack                                 |
| `pnpm db:new <name>` / `db:push` / `db:pull` / `db:types` | Migrations, hosted push, Drizzle and Supabase types  |
| `pnpm recipe:import` / `recipe:import:prod`               | Import `content/recipes` into the local / hosted DB  |
| `pnpm book:pdf` / `book:pdf:prod`                         | Build the recipe book PDF from the local / hosted DB |
| `pnpm photos:backfill` / `photos:backfill:prod`           | Point the seed recipes at their R2 photos            |

The book build needs `pandoc` on the PATH and Playwright's Chromium
(`pnpm exec playwright install chromium`).

## Project structure

```
content/
├── recipes/          # Recipe JSON, imported with pnpm recipe:import
└── book/             # Book prose and recipe order
docs/                 # Product notes, import guide, PRDs
scripts/              # Recipe import, book build, photo backfill
supabase/             # Local stack config and SQL migrations
src/
├── app/
│   ├── (public)/     # Home, recipes, tags, login
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

## Contributing

Commits follow Conventional Commits. Lefthook runs lint and type checks on commit, and CI runs the
dependency check and tests on every PR. Project conventions for agents and humans are in
[AGENTS.md](AGENTS.md).
