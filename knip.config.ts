import type { KnipConfig } from 'knip'

const config: KnipConfig = {
  // Files to exclude from Knip analysis
  ignore: [
    'tests/**/*.ts',
    'drizzle.config.ts', // Config file — evaluated at runtime, not a source module
    'src/apiClients/**/*.ts', // Ignore API clients - used by GraphQL codegen
    'src/graphql/**/*.ts', // Ignore GraphQL files - used by codegen
    'src/proxy.ts', // Next.js middleware — convention-based entry point, not imported
  ],
  // Atoms are the shared UI kit, so exports that no page uses yet are expected
  ignoreIssues: { 'src/components/atoms/**': ['exports', 'types'] },
  // Dependencies to ignore during analysis
  ignoreDependencies: [
    'conventional-changelog-conventionalcommits',
    'lefthook', // Git hooks manager — used as a CLI tool, not imported
  ],
  // Binaries to ignore during analysis
  ignoreBinaries: [],
  compilers: {
    css: (text: string) => [...text.matchAll(/(?<=@)import[^;]+/g)].join('\n'),
  },
}

export default config
