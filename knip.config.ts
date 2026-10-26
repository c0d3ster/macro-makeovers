import type { KnipConfig } from 'knip'

const config: KnipConfig = {
  // Files to exclude from Knip analysis
  ignore: [
    'tests/**/*.ts',
    'variants/**', // Variant overlays are only checked after init applies them @module:init
    'drizzle.config.ts', // Config file — evaluated at runtime, not a source module @module:database
    'src/apiClients/**/*.ts', // Ignore API clients - used by GraphQL codegen @module:graphql
    'src/graphql/**/*.ts', // Ignore GraphQL files - used by codegen @module:graphql
    'src/proxy.ts', // Next.js middleware — convention-based entry point, not imported @module:auth
  ],
  // #region @module:database+!graphql
  // With no GraphQL layer, nothing imports the Postgres client yet; it is a ready-to-use helper
  entry: ['src/libs/DB.ts'],
  // #endregion @module:database+!graphql
  // Atoms are the shared UI kit, so exports that no page uses yet are expected
  ignoreIssues: { 'src/components/atoms/**': ['exports', 'types'] },
  // Dependencies to ignore during analysis
  ignoreDependencies: [
    'conventional-changelog-conventionalcommits',
    'lefthook', // Git hooks manager — used as a CLI tool, not imported
    '@supabase/ssr', // Used by the supabase variant @module:init
    '@supabase/supabase-js', // Used by the supabase variant @module:init
    'supabase', // CLI for the supabase variant @module:init
  ],
  // Binaries to ignore during analysis
  ignoreBinaries: [],
  compilers: {
    css: (text: string) => [...text.matchAll(/(?<=@)import[^;]+/g)].join('\n'),
  },
}

export default config
