// The feature manifest: what each module owns and what is removed when it is switched off.
//
// Ids that users can pick (`selectableIds`) match the platform's ProjectFeature values.
// `graphql` is derived and `init` is the tooling itself; neither is ever picked directly.
//
// Code that belongs to a module but lives inside a shared file is marked with
// `@module:<id>` tags and `#region` blocks instead (see strip.ts).

export type VariantId = 'clerk-neon' | 'supabase'

export type ModuleId =
  | 'init'
  | 'database'
  | 'auth'
  | 'email'
  | 'file_uploads'
  | 'graphql'
  | 'realtime'

export type ModuleDef = {
  id: ModuleId
  label: string
  // Modules that must be kept whenever this one is
  requires: ModuleId[]
  // Variants this module exists in (all of them when omitted)
  availableIn?: VariantId[]
  // Kept automatically when any of these modules is kept
  derivedFrom?: ModuleId[]
  // Files and folders deleted when the module is off, relative to the project root
  paths: string[]
  // npm packages removed when the module is off (unless another kept module lists them)
  packages: string[]
  // package.json scripts removed when the module is off
  scripts: string[]
  // package.json scripts rewritten when the module is off
  scriptReplacements: Record<string, string>
  // Files rewritten with new content when the module is off (skipped if the folder is gone)
  writes: Record<string, string>
}

// What drizzle-kit expects when a database has no migrations yet
const EMPTY_JOURNAL = `${JSON.stringify({ version: '7', dialect: 'postgresql', entries: [] }, null, 2)}\n`

export const selectableIds: readonly ModuleId[] = ['database', 'auth', 'email', 'file_uploads', 'realtime']

export const modules: Record<ModuleId, ModuleDef> = {
  init: {
    id: 'init',
    label: 'Template setup tooling',
    requires: [],
    paths: ['scripts/init', 'variants', 'docs/TEMPLATING.md', '.github/workflows/feature-matrix.yml'],
    packages: ['tsx'],
    scripts: ['bootstrap'],
    scriptReplacements: {},
    writes: {},
  },

  database: {
    id: 'database',
    label: 'Database (Drizzle ORM + Postgres)',
    requires: [],
    paths: ['src/libs/DB.ts', 'src/models', 'drizzle.config.ts', 'scripts/build.js', 'migrations'],
    packages: ['drizzle-orm', 'drizzle-kit', 'pg', '@types/pg', 'dotenv'],
    scripts: ['db:generate', 'db:migrate', 'db:studio'],
    scriptReplacements: { build: 'pnpm run build:next' },
    writes: {},
  },

  auth: {
    id: 'auth',
    label: 'Authentication (Clerk) and user profiles',
    requires: ['database'],
    paths: [
      'src/proxy.ts',
      'src/proxy.test.ts',
      'src/app/api/webhook',
      'src/app/(auth)',
      'src/providers/ClerkProvider.tsx',
      'src/providers/ClerkProvider.test.tsx',
      'src/services/UserService.ts',
      'src/services/UserService.test.ts',
      'src/graphql/resolvers/UserResolver.ts',
      'src/graphql/schema/user.ts',
      'src/apiClients/userApiClient.ts',
      'src/apiClients/userApiClient.test.ts',
      'src/apiClients/fragments.ts',
      'src/models/users.ts',
      'src/models/enums.ts',
      'src/components/templates/CleanPageTemplate.tsx',
      'src/components/templates/CleanPageTemplate.test.tsx',
      'migrations/0000_create_users_table.sql',
      'migrations/meta/0000_snapshot.json',
      'tests/mocks/auth.ts',
    ],
    packages: ['@clerk/nextjs', '@clerk/localizations', 'svix'],
    scripts: [],
    scriptReplacements: {},
    writes: { 'migrations/meta/_journal.json': EMPTY_JOURNAL },
  },

  email: {
    id: 'email',
    label: 'Email and contact form (Resend)',
    requires: [],
    paths: [
      'src/services/EmailService.ts',
      'src/services/ContactService.ts',
      'src/graphql/resolvers/ContactResolver.ts',
      'src/graphql/schema/contact.ts',
      'src/apiClients/contactApiClient.ts',
      'src/apiClients/contactApiClient.test.ts',
      'src/components/molecules',
      'src/components/templates/useActiveNavItem.ts',
      'src/validations',
      'tests/e2e/ContactForm.e2e.ts',
    ],
    packages: ['resend', '@react-email/render', 'react-hook-form', '@hookform/resolvers'],
    scripts: [],
    scriptReplacements: {},
    writes: {},
  },

  // Presigned downloads from a Cloudflare R2 (S3 compatible) bucket. The S3 code in
  // src/utils/logo.ts, src/libs/Env.ts and next.config.ts is tagged with markers.
  file_uploads: {
    id: 'file_uploads',
    label: 'File storage (Cloudflare R2)',
    requires: [],
    paths: [],
    packages: ['@aws-sdk/client-s3', '@aws-sdk/s3-request-presigner'],
    scripts: [],
    scriptReplacements: {},
    writes: {},
  },

  // Live updates through Supabase Realtime. Its code ships with the supabase variant overlay.
  realtime: {
    id: 'realtime',
    label: 'Realtime updates (Supabase)',
    requires: ['auth'],
    availableIn: ['supabase'],
    paths: [],
    packages: [],
    scripts: [],
    scriptReplacements: {},
    writes: {},
  },

  graphql: {
    id: 'graphql',
    label: 'GraphQL API and Apollo client',
    requires: [],
    derivedFrom: ['auth', 'email'],
    paths: [
      'src/graphql',
      'src/services',
      'tests/mocks',
      'src/app/api/graphql',
      'src/apiClients',
      'src/libs/ApolloClient.ts',
      'codegen.ts',
      'scripts/codegen-with-retry.js',
    ],
    packages: [
      '@apollo/client',
      '@apollo/server',
      '@as-integrations/next',
      'graphql',
      'graphql-tag',
      'type-graphql',
      'class-validator',
      'reflect-metadata',
      '@graphql-codegen/cli',
      '@graphql-codegen/typescript',
      '@graphql-codegen/typescript-operations',
      '@graphql-codegen/typescript-react-apollo',
      '@parcel/watcher',
      'npm-run-all',
    ],
    scripts: ['codegen', 'codegen:watch'],
    scriptReplacements: { dev: 'pnpm run dev:next' },
    writes: {},
  },
}
