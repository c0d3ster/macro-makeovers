import type { CodegenConfig } from '@graphql-codegen/cli'

const config: CodegenConfig = {
  schema: 'http://localhost:3000/api/graphql',
  documents: ['src/apiClients/**/*.ts'], // all gql`` queries/mutations
  ignoreNoDocuments: true, // Don't fail if no documents found initially
  generates: {
    'src/graphql/generated/graphql.ts': {
      plugins: [
        'typescript',
        'typescript-operations',
        'typescript-react-apollo',
      ],
      config: {
        apolloClientVersion: 4,
        apolloReactHooksImportFrom: '@apollo/client/react',
        immutableTypes: true,
        useTypeImports: true,
        withHooks: true,
        withResultType: false,
        withVariablesTypes: false,
        withMutationFn: false,
        withMutationOptionsType: false,
      },
    },
  },
  watch: false,
  hooks: {
    afterAllFileWrite: [
      'eslint --fix --no-ignore src/graphql/generated/graphql.ts',
    ],
  },
}

export default config
