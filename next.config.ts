import type { NextConfig } from 'next'

import withBundleAnalyzer from '@next/bundle-analyzer'

// #region @module:file_uploads
// R2 configuration constants
const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME
const R2_PUBLIC_HOST =
  R2_ACCOUNT_ID && R2_BUCKET_NAME
    ? `${R2_BUCKET_NAME}.${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`
    : null
// #endregion @module:file_uploads

// #region @module:auth+supabase
// Supabase configuration constants
const SUPABASE_HOST = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
  : null
// #endregion @module:auth+supabase

// Define the base Next.js configuration
const baseConfig: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  // #region @module:graphql
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
  // #endregion @module:graphql
  images: {
    remotePatterns: [
      // #region @module:auth+clerk
      {
        protocol: 'https',
        hostname: 'img.clerk.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.clerk.dev',
        port: '',
        pathname: '/**',
      },
      // #endregion @module:auth+clerk
      // #region @module:auth+supabase
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
      // #endregion @module:auth+supabase
      // #region @module:file_uploads
      // Add R2 public host if R2 is configured
      ...(R2_PUBLIC_HOST
        ? [
            {
              protocol: 'https' as const,
              hostname: R2_PUBLIC_HOST,
              port: '',
              pathname: '/**',
            },
          ]
        : []),
      // #endregion @module:file_uploads
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
