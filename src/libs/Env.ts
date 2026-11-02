import { createEnv } from '@t3-oss/env-nextjs'
import { z } from 'zod'

export const Env = createEnv({
  server: {
    DATABASE_URL: z.string().optional(),
    RESEND_API_KEY: z.string().optional(),
    SUPPORT_EMAIL: z.string().default('support@example.com'),
    // Both optional: without them, publishing a recipe does not trigger a book rebuild
    GITHUB_DISPATCH_TOKEN: z.string().optional(),
    GITHUB_REPO: z.string().optional(),
  },
  client: {
    NEXT_PUBLIC_APP_URL: z.string().optional(),
    NEXT_PUBLIC_SUPABASE_URL: z.string().optional(),
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().optional(),
    NEXT_PUBLIC_BRAND_NAME: z.string().default('MyApp'),
  },
  shared: {
    NODE_ENV: z.enum(['test', 'development', 'production']).optional(),
  },
  // You need to destructure all the keys manually
  runtimeEnv: {
    DATABASE_URL: process.env.DATABASE_URL,
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    SUPPORT_EMAIL: process.env.SUPPORT_EMAIL,
    GITHUB_DISPATCH_TOKEN: process.env.GITHUB_DISPATCH_TOKEN,
    GITHUB_REPO: process.env.GITHUB_REPO,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    NEXT_PUBLIC_BRAND_NAME: process.env.NEXT_PUBLIC_BRAND_NAME,
    NODE_ENV: process.env.NODE_ENV,
  },
})

// Runtime validation helpers - use these when you actually need the variables
export const requireEnv = {
  DATABASE_URL: (): string => {
    if (!Env.DATABASE_URL) {
      throw new Error('DATABASE_URL is required but not set')
    }
    return Env.DATABASE_URL
  },
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
}
