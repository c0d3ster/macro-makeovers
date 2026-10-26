// Variants swap the provider behind the `auth` and `database` modules.
//
//   clerk-neon  the code that lives in src/ today (Clerk sessions, Drizzle migrations)
//   supabase    Supabase Auth, SQL migrations through the Supabase CLI, and Realtime
//
// A variant is an overlay: files copied over the project, a delete list for the other
// variant's files, package changes, and per-module overrides of what each module owns.
// Both variants' npm packages stay in package.json so Dependabot keeps them current;
// each variant prunes the other's.

import type { ModuleDef, ModuleId, VariantId } from './modules'

import { modules } from './modules'

export type VariantDef = {
  id: VariantId
  label: string
  // Marker id that is on whenever this variant is chosen (`@module:supabase`)
  flag: 'clerk' | 'supabase'
  // Requested features that choose this variant when none is given explicitly
  impliedBy: string[]
  // Folder whose contents are copied over the project root, relative to the project
  overlay?: string
  // Folder of slot replacements for shared files, mirroring their paths (see slots.ts)
  replace?: string
  // Deleted before the overlay is copied: files only the other variant uses
  removePaths: string[]
  // npm packages only the other variant uses
  removePackages: string[]
  scripts: { set: Record<string, string>; remove: string[] }
  // Replaces fields of the base module definitions
  modules: Partial<Record<ModuleId, Partial<ModuleDef>>>
}

export const variants: Record<VariantId, VariantDef> = {
  'clerk-neon': {
    id: 'clerk-neon',
    label: 'Clerk + Neon (Drizzle migrations)',
    flag: 'clerk',
    impliedBy: [],
    removePaths: [],
    removePackages: ['@supabase/ssr', '@supabase/supabase-js', 'supabase'],
    scripts: { set: {}, remove: [] },
    modules: {},
  },

  supabase: {
    id: 'supabase',
    label: 'Supabase (Auth, SQL migrations, Realtime)',
    flag: 'supabase',
    impliedBy: ['realtime'],
    overlay: 'variants/supabase/files',
    replace: 'variants/supabase/replace',
    removePaths: [
      'src/app/api/webhook',
      'src/providers/ClerkProvider.tsx',
      'src/providers/ClerkProvider.test.tsx',
      'migrations',
      'scripts/build.js',
    ],
    removePackages: ['@clerk/nextjs', '@clerk/localizations', 'svix'],
    scripts: {
      set: {
        'db:start': 'supabase start',
        'db:stop': 'supabase stop',
        'db:new': 'supabase migration new',
        'db:push': 'supabase db push',
        'db:reset': 'supabase db reset',
        'db:pull': 'drizzle-kit pull',
        // Migrations are applied with `supabase db push`, not during the build
        'build': 'pnpm run build:next',
      },
      remove: ['db:generate', 'db:migrate', 'db:studio'],
    },
    modules: {
      database: {
        paths: ['src/libs/DB.ts', 'src/models', 'drizzle.config.ts', 'supabase'],
        packages: ['drizzle-orm', 'drizzle-kit', 'pg', '@types/pg', 'dotenv', 'supabase'],
        scripts: ['db:start', 'db:stop', 'db:new', 'db:push', 'db:reset', 'db:pull'],
        scriptReplacements: {},
      },
      auth: {
        paths: [
          'src/proxy.ts',
          'src/proxy.test.ts',
          'src/app/(auth)',
          'src/app/(public)/login',
          'src/app/auth',
          'src/libs/supabase',
          'src/providers/AuthProvider.tsx',
          'src/providers/AuthContext.ts',
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
          'src/components/molecules/auth',
          'src/utils/Redirect.ts',
          'src/utils/Redirect.test.ts',
          'src/validations/AuthValidation.ts',
          'supabase/migrations/20261020000000_create_users_table.sql',
          'tests/mocks/auth.ts',
        ],
        // The sign-in form uses react-hook-form, so auth needs it even without email
        packages: [
          '@supabase/supabase-js',
          '@supabase/ssr',
          'react-hook-form',
          '@hookform/resolvers',
        ],
        writes: {},
      },
      email: {
        paths: [
          'src/services/EmailService.ts',
          'src/services/ContactService.ts',
          'src/graphql/resolvers/ContactResolver.ts',
          'src/graphql/schema/contact.ts',
          'src/apiClients/contactApiClient.ts',
          'src/apiClients/contactApiClient.test.ts',
          'src/components/molecules/contact',
          'src/components/templates/useActiveNavItem.ts',
          'src/validations/ContactValidation.ts',
          'tests/e2e/ContactForm.e2e.ts',
        ],
      },
      realtime: {
        paths: [
          'src/hooks',
          'src/components/molecules/profile',
          'supabase/migrations/20261023164812_enable_users_realtime.sql',
        ],
      },
      graphql: {
        // Both barrels export only auth/email/realtime code, so they go with GraphQL
        paths: [
          'src/graphql',
          'src/services',
          'tests/mocks',
          'src/app/api/graphql',
          'src/apiClients',
          'src/libs/ApolloClient.ts',
          'codegen.ts',
          'scripts/codegen-with-retry.js',
          'src/components/molecules',
          'src/validations',
        ],
      },
    },
  },
}

export const variantIds = Object.keys(variants) as VariantId[]

export const isVariantId = (value: string): value is VariantId =>
  (variantIds as string[]).includes(value)

// Module definitions for a variant: the base manifest with the variant's overrides applied
export const getModules = (variant: VariantId): Record<ModuleId, ModuleDef> => {
  const overrides = variants[variant].modules
  const ids = Object.keys(modules) as ModuleId[]

  return Object.fromEntries(
    ids.map((id) => [id, { ...modules[id], ...overrides[id] }])
  ) as Record<ModuleId, ModuleDef>
}

// Explicit choice wins, then a variant implied by the requested features, then the default
export const resolveVariant = (
  explicit: string | undefined,
  requested: readonly string[]
): VariantId => {
  if (explicit !== undefined) {
    if (!isVariantId(explicit)) {
      throw new Error(`Unknown variant "${explicit}". Choose one of: ${variantIds.join(', ')}`)
    }
    return explicit
  }

  const implied = variantIds.find((id) =>
    variants[id].impliedBy.some((feature) => requested.includes(feature))
  )
  return implied ?? 'clerk-neon'
}
