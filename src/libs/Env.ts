import { createEnv } from '@t3-oss/env-nextjs'
import { z } from 'zod'

export const Env = createEnv({
  server: {
    CLERK_SECRET_KEY: z.string().optional(), // @module:auth+clerk
    CLERK_WEBHOOK_SECRET: z.string().optional(), // @module:auth+clerk
    SUPABASE_SECRET_KEY: z.string().optional(), // @module:auth+supabase
    DATABASE_URL: z.string().optional(), // @module:database
    RESEND_API_KEY: z.string().optional(), // @module:email
    PROJECT_LOGO_KEY: z.string().optional(), // @module:file_uploads
    R2_ACCOUNT_ID: z.string().optional(), // @module:file_uploads
    R2_ACCESS_KEY_ID: z.string().optional(), // @module:file_uploads
    R2_SECRET_ACCESS_KEY: z.string().optional(), // @module:file_uploads
    R2_BUCKET_NAME: z.string().optional(), // @module:file_uploads
    SUPPORT_EMAIL: z.string().default('support@example.com'), // @module:email
  },
  client: {
    NEXT_PUBLIC_APP_URL: z.string().optional(),
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().optional(), // @module:auth+clerk
    NEXT_PUBLIC_SUPABASE_URL: z.string().optional(), // @module:auth+supabase
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().optional(), // @module:auth+supabase
    NEXT_PUBLIC_BRAND_NAME: z.string().default('MyApp'),
  },
  shared: {
    NODE_ENV: z.enum(['test', 'development', 'production']).optional(),
  },
  // You need to destructure all the keys manually
  runtimeEnv: {
    CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY, // @module:auth+clerk
    CLERK_WEBHOOK_SECRET: process.env.CLERK_WEBHOOK_SECRET, // @module:auth+clerk
    SUPABASE_SECRET_KEY: process.env.SUPABASE_SECRET_KEY, // @module:auth+supabase
    DATABASE_URL: process.env.DATABASE_URL, // @module:database
    RESEND_API_KEY: process.env.RESEND_API_KEY, // @module:email
    PROJECT_LOGO_KEY: process.env.PROJECT_LOGO_KEY, // @module:file_uploads
    R2_ACCOUNT_ID: process.env.R2_ACCOUNT_ID, // @module:file_uploads
    R2_ACCESS_KEY_ID: process.env.R2_ACCESS_KEY_ID, // @module:file_uploads
    R2_SECRET_ACCESS_KEY: process.env.R2_SECRET_ACCESS_KEY, // @module:file_uploads
    R2_BUCKET_NAME: process.env.R2_BUCKET_NAME, // @module:file_uploads
    SUPPORT_EMAIL: process.env.SUPPORT_EMAIL, // @module:email
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    // #region @module:auth+clerk
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY:
      process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
    // #endregion @module:auth+clerk
    // #region @module:auth+supabase
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    // #endregion @module:auth+supabase
    NEXT_PUBLIC_BRAND_NAME: process.env.NEXT_PUBLIC_BRAND_NAME,
    NODE_ENV: process.env.NODE_ENV,
  },
})

// #region @module:database
// Runtime validation helpers - use these when you actually need the variables
export const requireEnv = {
  // #region @module:auth+clerk
  CLERK_SECRET_KEY: (): string => {
    if (!Env.CLERK_SECRET_KEY) {
      throw new Error('CLERK_SECRET_KEY is required but not set')
    }
    return Env.CLERK_SECRET_KEY
  },
  // #endregion @module:auth+clerk
  DATABASE_URL: (): string => {
    if (!Env.DATABASE_URL) {
      throw new Error('DATABASE_URL is required but not set')
    }
    return Env.DATABASE_URL
  },
  // #region @module:auth+clerk
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: (): string => {
    if (!Env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
      throw new Error(
        'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY is required but not set'
      )
    }
    return Env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
  },
  // #endregion @module:auth+clerk
  // #region @module:auth+supabase
  NEXT_PUBLIC_SUPABASE_URL: (): string => {
    if (!Env.NEXT_PUBLIC_SUPABASE_URL) {
      throw new Error('NEXT_PUBLIC_SUPABASE_URL is required but not set')
    }
    return Env.NEXT_PUBLIC_SUPABASE_URL
  },
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: (): string => {
    if (!Env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) {
      throw new Error(
        'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY is required but not set'
      )
    }
    return Env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  },
  // #endregion @module:auth+supabase
}
// #endregion @module:database
