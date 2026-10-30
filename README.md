# Next.js GraphQL Template

A minimal, production-ready template for modern web applications built with Next.js, GraphQL, and TypeScript.

## 🎯 What This Template Provides

- **Modern Frontend**: Next.js 15 with App Router, React 19, TypeScript, Tailwind CSS
- **GraphQL API**: Apollo Server with type-graphql for schema-first development

- **Authentication**: Supabase Auth with email/password and Google sign-in

- **Atomic Design**: Organized component structure (atoms, molecules, organisms, templates)
- **Type Safety**: Full TypeScript coverage with automatic GraphQL type generation
- **Testing**: Vitest for unit tests, Playwright for E2E tests
- **Developer Experience**: ESLint, Prettier, automated workflows

- **Database**: Supabase Postgres with Drizzle ORM for queries, Supabase CLI for migrations

- **Code Quality**: Commitlint, semantic release, dependency checking

## 🛠️ Tech Stack

![React](https://img.shields.io/badge/-React-61DAFB?logo=react&logoColor=black&style=flat)
![Next.js](https://img.shields.io/badge/-Next.js-000000?logo=next.js&logoColor=white&style=flat)
![TypeScript](https://img.shields.io/badge/-TypeScript-3178C6?logo=typescript&logoColor=white&style=flat)
![Node.js](https://img.shields.io/badge/-Node.js-339933?logo=node.js&logoColor=white&style=flat)
![PostgreSQL](https://img.shields.io/badge/-PostgreSQL-336791?logo=postgresql&logoColor=white&style=flat)
![GraphQL](https://img.shields.io/badge/-GraphQL-E10098?logo=graphql&logoColor=white&style=flat)

## 🏗️ Architecture

Clean, layered architecture designed for scalability:

```
FRONTEND (React / Next.js)
──────────────────────────
components/pages/hooks
   │
   ▼
apiClients/ (GraphQL operations)
   - ContactApiClient.ts
   - UserApiClient.ts
   │
   ▼
APOLLO CLIENT
   - GraphQL query/mutation execution
   - Caching and state management
   - Type-safe operations
   │
   ▼
APOLLO SERVER (GraphQL API)
   - type-graphql schema generation
   - Resolver execution
   - Authentication & authorization
   │
   ▼
GRAPHQL RESOLVERS
   - ContactResolver.ts
   - UserResolver.ts
   │
   ▼
SERVICE LAYER
   - ContactService.ts
   - UserService.ts
   - Authentication & permission checking
   │
   ▼
DATABASE / EXTERNAL APIs

- Drizzle ORM / Supabase Auth / Supabase Postgres

```

### Key Features

- **Frontend**: React components with TypeScript and Tailwind CSS
- **API Layer**: GraphQL with Apollo Client and automatic code generation
- **Business Logic**: Service layer with authentication and permission handling

- **Data Layer**: Supabase Postgres with Drizzle ORM
- **Authentication**: Supabase Auth with cookie sessions (`@supabase/ssr`)

- **Testing**: Vitest for unit tests, Playwright for E2E tests

## ⚙️ Quick Start

1. **Clone and install:** (needs Node 20+ and pnpm; run `corepack enable` if you do not have pnpm)

   ```bash
   git clone <this-template-repo>
   cd <project-name>
   pnpm install
   ```

2. **Set up environment:**

   This template follows the pattern from [Next.js Boilerplate](https://github.com/ixartz/Next-js-Boilerplate):
   - **`.env`** files contain non-sensitive, template/example values (committed to git)
   - **`.env.local`** files contain sensitive values (git-ignored, never committed)
   - Sensitive variables like API keys, secrets, and database URLs should always go in `.local` files

   Create a `.env.local` file (git-ignored) with your values:

   ```bash

   ```

# Local Supabase: run `pnpm run db:start` (step 3), then copy the keys from `pnpm exec supabase status`

NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
SUPABASE_SECRET_KEY=sb_secret_...

# Postgres from the local Docker stack

DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:54322/postgres

# Optional

NEXT_PUBLIC_APP_URL=http://localhost:3000
RESEND_API_KEY=re_...
PORTFOLIO_SECRET_TOKEN=your-secret-token

````

**For production**, create `.env.production.local` with production values.

**For CI/CD**, add secrets under Repository → Settings → Secrets and variables → Actions:

- `CODECOV_TOKEN` (optional, uploads coverage reports)



3. **Start the local database:**

Develop against the local Supabase stack. It needs [Docker](https://docs.docker.com/get-docker/) running.

```bash
pnpm run db:start
````

This boots Postgres, auth and Studio (<http://127.0.0.1:54323>) and applies `supabase/migrations`. It prints the
local URL and keys for step 2. Stop it with `pnpm run db:stop`, or rebuild the database from the migrations with
`pnpm run db:reset`.

Migrations are plain SQL in `supabase/migrations`. Create one with `pnpm run db:new <name>` and apply it with
`pnpm run db:reset`. Drizzle is used for queries only. After changing the schema, run `pnpm run db:pull`
(introspects the database into `.drizzle/`) and port the result into `src/models`.

**Security model:** enable row level security on every table you add. Once enabled it denies everything until a
policy allows it, which is how `users` is set up. RLS protects the Supabase API and Realtime, which run as the
signed-in user, so a table only emits Realtime events once it has a `select` policy. Drizzle connects as `postgres`
and bypasses RLS, so every query in `src/services` must check access itself, as `getUserById` and `updateUser` do.
Treat RLS as a backstop, not as the app's access control.

**Hosted project (production):** create a project at [supabase.com](https://supabase.com), then link it and push
the migrations:

```bash
pnpm exec supabase login
pnpm exec supabase link --project-ref <project-ref>
pnpm run db:push
```

Set `NEXT_PUBLIC_SUPABASE_URL` (`https://<project-ref>.supabase.co`) and the keys from Dashboard → Project
Settings → API Keys. For `DATABASE_URL`, use Dashboard → Connect: the transaction pooler (port 6543) at runtime,
and the direct or session connection (port 5432) for `db:pull`.

**Google sign-in (local):** it is enabled in `supabase/config.toml`, but the stack starts without credentials and
"Continue with Google" only errors until you add them. Create an OAuth client in Google Cloud Console (Web
application) with the authorized redirect URI `http://127.0.0.1:54321/auth/v1/callback`, then create
`supabase/.env` (git-ignored) and restart with `pnpm run db:stop && pnpm run db:start`. Email and password sign-in
works locally with no extra setup.

```bash
SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID=<client id>
SUPABASE_AUTH_EXTERNAL_GOOGLE_SECRET=<client secret>
```

**Google sign-in (hosted):** use `https://<project-ref>.supabase.co/auth/v1/callback` as the redirect URI, then
enable Authentication → Providers → Google in Supabase and paste the client ID and secret. Each environment needs
its own setup. Set Authentication → URL Configuration → Redirect URLs to include
`http://localhost:3000/auth/callback` (and your production URL).

4. **Start development:**
   ```bash
   pnpm run dev
   ```

## 🔐 Authentication Demo

This template includes a complete authentication demonstration:

- **Public Pages**: Homepage with contact form
- **Protected Pages**: `/profile` (requires authentication)
- **Authentication Flow**:

- Sign in/up on the `/login` page (email and password)

  - Automatic redirects for protected routes
  - User session management
  - Sign out functionality

Try accessing `/profile` without signing in - you'll be redirected to `/login`.

## 🎨 Theming

Six color variables in `src/styles/global.css`:

- `primary`, `accent`, `background`, `surface`, `text`, `text-muted`

Use as Tailwind classes: `bg-primary`, `text-text`, `bg-surface`, etc.

Colors must be in RGB format (space-separated) for opacity support: `59 130 246`

## 📦 Component Structure

Organized using Atomic Design principles:

```
src/components/
├── atoms/          # Basic building blocks (buttons, inputs, etc.)
├── molecules/      # Simple combinations of atoms (ContactForm, etc.)
├── organisms/      # Complex UI components (SiteHeader, etc.)
└── templates/      # Page-level layouts
```

## 📦 Available Scripts

- `pnpm run dev` - Start development server with GraphQL codegen watch
- `pnpm run build` - Build for production
- `pnpm run test` - Run unit tests with Vitest
- `pnpm run test:e2e` - Run E2E tests with Playwright
- `pnpm run lint` - Run ESLint

- `pnpm run db:start` / `pnpm run db:stop` - Start or stop the local Supabase stack (needs Docker)
- `pnpm run db:new <name>` - Create a new SQL migration
- `pnpm run db:push` - Apply migrations to the linked Supabase project
- `pnpm run db:reset` - Reset the local Supabase database (needs Docker)
- `pnpm run db:pull` - Introspect the database into Drizzle schema files

- `pnpm run codegen` - Generate GraphQL types
- `pnpm run codegen:watch` - Watch and regenerate GraphQL types

## 🧪 Testing

- **Unit Tests**: Vitest with comprehensive coverage
- **E2E Tests**: Playwright for end-to-end testing
- **Mocking**: Centralized mocks in `tests/mocks/`
- **Test Setup**: Configured for both unit and E2E testing

## 📁 Project Structure

```
src/
├── app/                    # Next.js app router pages
│   ├── (auth)/            # Protected routes
│   │   └── profile/       # User profile page
│   ├── (public)/          # Public routes
│   │   └── page.tsx       # Homepage
│   └── api/               # API routes
│       └── graphql/       # GraphQL endpoint
├── components/            # React components (atomic design)
├── graphql/              # GraphQL schema, resolvers, and context
├── services/             # Business logic layer
├── libs/                 # Utility libraries (DB, Logger, etc.)
├── models/               # Database models
├── validations/          # Form validation schemas
└── utils/                # Helper utilities
```

## 🚀 Deployment

This template is ready for deployment on platforms like:

- Vercel (recommended for Next.js)
- Railway
- Render
- DigitalOcean App Platform

Make sure to configure your environment variables in your deployment platform.

---

**Template for modern web applications**

> **Inspired by**: [Next.js Boilerplate](https://github.com/ixartz/Next-js-Boilerplate) - A comprehensive Next.js starter template
