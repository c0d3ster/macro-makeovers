# Deployment

The site runs on Vercel at [macromakeovers.com](https://macromakeovers.com), with environment
variables set in the Vercel project. Production uses a hosted Supabase project.

## Hosted Supabase

Create a project at [supabase.com](https://supabase.com), then link it and push the migrations:

```bash
pnpm exec supabase login
pnpm exec supabase link --project-ref <project-ref>
pnpm db:push
```

`db:push` runs `supabase db push --remote`. Supabase CLI 3.x pushes to the local database unless
told otherwise, so the flag is what sends migrations to the linked hosted project.

## Environment variables

- `NEXT_PUBLIC_SUPABASE_URL` is `https://<project-ref>.supabase.co`, and
  `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` comes from Dashboard → Project Settings → API Keys.
- `NEXT_PUBLIC_BRAND_NAME` is the site name used in page titles.
- `DATABASE_URL` uses the transaction pooler (port 6543) at runtime and the direct or session
  connection (port 5432) for `db:pull`. Recipe pages are built ahead of time, so set it for the
  build too. Without it the build still succeeds and recipe pages render on first visit instead.
- `NEXT_PUBLIC_APP_URL` is the public site URL. Share images, the sitemap, and the Claude connector
  are built from it.
- `GITHUB_DISPATCH_TOKEN` and `GITHUB_REPO` let the app trigger book rebuilds. Without them the
  app logs and skips the rebuild.
- `OPENAI_API_KEY` and the `R2_*` values turn on placeholder photos.
- `RESEND_API_KEY` sends email from hello@macromakeovers.com, a verified Resend domain. `SUPPORT_EMAIL`
  is where makeover ideas from the about page go (default hello@macromakeovers.com).

`src/libs/Env.ts` has the full list. `.env` and `.env.production` hold the public defaults, and
`.env.example` covers the optional values.

## GitHub Actions

- `CI.yml` runs on pushes and pull requests to `main`: build, lint, type check, `check:deps`, unit
  tests, e2e, and a commit message check on pull requests. It needs the `CODECOV_TOKEN` secret for
  coverage uploads.
- `release.yml` runs semantic-release when a CI run on `main` completes.
- `book.yml` builds the recipe book PDF from the hosted database. It runs on pushes to `main` that
  touch `docs/` or `content/`, by hand, and on the app's `recipe-book-rebuild` dispatch. It needs
  the `DATABASE_URL` secret (read only) and the `R2_PUBLIC_URL` variable.

## Google sign-in

**Local:** Google is enabled in `supabase/config.toml`, but "Continue with Google" errors until you
add credentials. Create an OAuth client in Google Cloud Console (Web application) with the redirect
URI `http://127.0.0.1:54321/auth/v1/callback`, then create `supabase/.env` (git-ignored, never
commit it) and restart with `pnpm db:stop && pnpm db:start`:

```bash
SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID=<client id>
SUPABASE_AUTH_EXTERNAL_GOOGLE_SECRET=<client secret>
```

**Hosted:** use `https://<project-ref>.supabase.co/auth/v1/callback` as the redirect URI, then
enable Authentication → Providers → Google in Supabase and paste the client ID and secret. Each
environment needs its own setup. Add `http://localhost:3000/auth/callback` and your production
`/auth/callback` under Authentication → URL Configuration → Redirect URLs.

## Hosted recipes

To import recipe files into the hosted database, use `pnpm recipe:import:prod <file-or-folder>`,
which reads `.env.production` and `.env.production.local`. Day to day, recipes go through `/admin`
or the Claude connector instead. The Claude connector's one-time setup is in
[importing-recipes.md](./importing-recipes.md#importing-from-claude-mcp-connector).
