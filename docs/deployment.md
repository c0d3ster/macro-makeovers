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

## Environment variables

- `NEXT_PUBLIC_SUPABASE_URL` is `https://<project-ref>.supabase.co`, and the keys come from
  Dashboard → Project Settings → API Keys.
- `DATABASE_URL` uses the transaction pooler (port 6543) at runtime and the direct or session
  connection (port 5432) for `db:pull`. Recipe pages are built ahead of time, so set it for the
  build too. Without it the build still succeeds and recipe pages render on first visit instead.
- `NEXT_PUBLIC_APP_URL` is the public site URL. Share images, the sitemap, and the Claude connector
  are built from it.
- `GITHUB_DISPATCH_TOKEN` and `GITHUB_REPO` let the app trigger book rebuilds. Without them the
  app logs and skips the rebuild.
- `OPENAI_API_KEY` and the `R2_*` values turn on placeholder photos. See `.env.example` for the
  full list.

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
