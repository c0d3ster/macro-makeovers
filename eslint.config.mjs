import antfu from '@antfu/eslint-config'
import prettier from 'eslint-config-prettier'
import jsxA11y from 'eslint-plugin-jsx-a11y'
import playwright from 'eslint-plugin-playwright'
import tailwind from 'eslint-plugin-tailwindcss'
import { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

export default antfu(
  {
    react: true,
    nextjs: true,
    typescript: true,

    // Configuration preferences
    lessOpinionated: true,
    isInEditor: false,

    // Format settings - disabled to let Prettier handle formatting
    formatters: {
      css: false,
    },

    // Ignored paths
    ignores: ['migrations/**/*', 'supabase/**/*', 'variants/**/*', '**/*.md'],
  },
  // --- Accessibility Rules ---
  jsxA11y.flatConfigs.recommended,
  // --- Tailwind CSS Rules ---
  tailwind.configs.recommended,
  {
    settings: {
      tailwindcss: {
        cssConfigPath: `${dirname(fileURLToPath(import.meta.url))}/src/styles/global.css`,
      },
    },
  },
  // --- E2E Testing Rules ---
  {
    files: ['**/*.spec.ts', '**/*.e2e.ts'],
    ...playwright.configs['flat/recommended'],
    rules: {
      'style/quotes': 'off', // Allow different quote styles in test files
    },
  },

  // --- Custom Rule Overrides ---
  {
    rules: {
      'antfu/no-top-level-await': 'off', // Allow top-level await
      'style/brace-style': ['error', '1tbs'], // Use the default brace style
      'ts/consistent-type-definitions': ['error', 'type'], // Use `type` instead of `interface`
      'react/prefer-destructuring-assignment': 'off', // Vscode doesn't support automatically destructuring, it's a pain to add a new variable
      'node/prefer-global/process': 'off', // Allow using `process.env`
      'test/padding-around-all': 'error', // Add padding in test files
      'test/prefer-lowercase-title': 'off', // Allow using uppercase titles in test titles
      'react-hooks-extra/no-unnecessary-use-prefix': 'off', // Disable the annoying use prefix rule
      'e18e/prefer-static-regex': 'off', // Regex perf micro-optimization, not worth the noise
      'next/no-img-element': 'off', // Allow <img> for dynamic URLs (e.g. presigned R2 URLs)
      'perfectionist/sort-imports': [
        'error',
        {
          type: 'alphabetical',
          order: 'asc',
          groups: [
            'type-import',
            ['value-builtin', 'value-external'],
            'type-internal',
            'value-internal',
            ['type-parent', 'type-sibling', 'type-index'],
            ['value-parent', 'value-sibling', 'value-index'],
            'ts-equals-import',
            'unknown',
          ],
          newlinesBetween: 1,
          partitionByNewLine: false,
        },
      ],
    },
  },
  // --- Prettier Config (must be last) ---
  prettier
)
