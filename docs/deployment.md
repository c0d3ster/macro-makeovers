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

## Grocery partners

Start Instacart first. Its production review takes the longest.

### Instacart (Developer Platform)

1. Sign up at the [Instacart Developer Platform](https://docs.instacart.com/developer_platform_api/get_started/overview) and open the Developer Dashboard.
2. API Keys → create a **Development** key. Copy it right away, since it is only shown once. Set `INSTACART_API_KEY` and `INSTACART_API_URL=https://connect.dev.instacart.tools`.
3. Build against dev, then work through the [pre-launch checklist](https://docs.instacart.com/developer_platform_api/guide/concepts/launch_activities/pre-launch_checklist/). That includes the "Shop on Instacart" button with the logo and brand colors from their kit.
4. Create a **Production** key. It sits in "Pending approval" and does nothing until it is approved.
5. Record a short screen capture of the full flow. Instacart reaches out within 5 business days to ask for it ([approval process](https://docs.instacart.com/developer_platform_api/guide/concepts/launch_activities/approval_process)). The average from request to a working prod key is about 30 to 40 days.
6. Once approved, swap in the prod key and drop `INSTACART_API_URL`.

### Kroger (Developer Portal)

1. Create an account at [developer.kroger.com](https://developer.kroger.com/), then Manage → Apps → Register.
2. Pick **Production**. Credentials are locked to the environment they were made for, and Cart can only be tested in production because certification has no customer accounts.
3. Add the Products, Locations, Cart, and Identity API products so the app gets their scopes (`product.compact`, `cart.basic:write`, `profile.compact`).
4. Set the redirect URI to `<app url>/api/grocery/kroger/callback`. Add the localhost one too for dev.
5. Copy the client secret right away, since it is only shown once. Set `KROGER_CLIENT_ID`, `KROGER_CLIENT_SECRET`, and `GROCERY_TOKEN_SECRET` (32+ random chars, e.g. `openssl rand -base64 32`).
6. Check the endpoint paths in `krogerApi.ts` against the [Cart API reference](https://developer.kroger.com/reference/api/cart-api-partner) while logged in. The docs only render in the portal.

### Walmart (affiliate program via Impact)

1. No API key is needed for the cart link itself (`walmart.com/sc/cart/addToCart?items=<id>_<qty>&storeId=<id>`, per [walmart.io](https://walmart.io/docs/atc/v1/add-to-cart)).
2. To earn on it, go to [affiliates.walmart.com](https://affiliates.walmart.com) → Join Now. That sends you to Impact. Create the account, find Walmart, and Apply. Decisions usually come within a day.
3. Once approved, make a tracking link in Impact and set `WALMART_AFFILIATE_LINK`.
4. Curate `WALMART_ITEM_IDS` in `src/libs/grocery/itemMappings.ts` (the id is the number at the end of a walmart.com product URL). Walmart shows once one is mapped.
5. Optional: real store ids for pickup carts come from Walmart's store locator API, which needs a separate [walmart.io](https://walmart.io) account.

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
