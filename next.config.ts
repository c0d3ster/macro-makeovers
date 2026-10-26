import type { NextConfig } from 'next'

import withBundleAnalyzer from '@next/bundle-analyzer'

// Supabase configuration constants
const SUPABASE_HOST = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
  : null

// Define the base Next.js configuration
const baseConfig: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  // type-graphql + reflect-metadata break when bundled/minified (invalid GraphQL names like "$").
  serverExternalPackages: [
    '@apollo/server',
    '@as-integrations/next',
    'graphql',
    'graphql-scalars',
    'graphql-query-complexity',
    'reflect-metadata',
    'type-graphql',
  ],
  images: {
    remotePatterns: [
      // Supabase Storage public objects
      ...(SUPABASE_HOST
        ? [
            {
              protocol: 'https' as const,
              hostname: SUPABASE_HOST,
              port: '',
              pathname: '/storage/v1/object/public/**',
            },
          ]
        : []),
    ],
  },
}

// Conditionally enable bundle analysis
let configWithPlugins = baseConfig
if (process.env.ANALYZE === 'true') {
  configWithPlugins = withBundleAnalyzer()(baseConfig)
}

const nextConfig = configWithPlugins
export default nextConfig
