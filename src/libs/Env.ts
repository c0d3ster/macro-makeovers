import { createEnv } from '@t3-oss/env-nextjs'
import { z } from 'zod'

export const Env = createEnv({
  server: {
    DATABASE_URL: z.string().optional(),
    RESEND_API_KEY: z.string().optional(),
    // Where makeover ideas from the about page go
    SUPPORT_EMAIL: z.string().default('hello@macromakeovers.com'),
    // Both optional: without them, publishing a recipe does not trigger a book rebuild
    GITHUB_DISPATCH_TOKEN: z.string().optional(),
    GITHUB_REPO: z.string().optional(),
    OPENAI_API_KEY: z.string().optional(),
    R2_ACCOUNT_ID: z.string().optional(),
    R2_ACCESS_KEY_ID: z.string().optional(),
    R2_SECRET_ACCESS_KEY: z.string().optional(),
    R2_BUCKET: z.string().optional(),
    // Public base URL of the bucket (r2.dev or a custom domain)
    R2_PUBLIC_URL: z.string().optional(),
    // Grocery handoff (PRD 02 phase 4). Each grocer only shows once its keys are set.
    // Seals the member's grocer tokens (Kroger) into an httpOnly cookie. 32+ random characters.
    GROCERY_TOKEN_SECRET: z.string().min(32).optional(),
    INSTACART_API_KEY: z.string().optional(),
    // https://connect.instacart.com (default) or https://connect.dev.instacart.tools for a dev key
    INSTACART_API_URL: z.string().url().optional(),
    KROGER_CLIENT_ID: z.string().optional(),
    KROGER_CLIENT_SECRET: z.string().optional(),
    // Defaults to https://api.kroger.com
    KROGER_API_URL: z.string().url().optional(),
    // Walmart needs no key for the cart link, only item ids in src/libs/grocery/itemMappings.ts
    // Optional Impact tracking link that wraps the cart link so orders earn a commission
    WALMART_AFFILIATE_LINK: z.string().url().optional(),
    // Private bucket for the recipe book PDF, served through short-lived signed links. Uses the
    // same R2 account and keys as the photos.
    R2_BOOK_BUCKET: z.string().optional(),
    // Stripe: all three turn on checkout, the billing portal, and the webhook
    STRIPE_SECRET_KEY: z.string().optional(),
    STRIPE_WEBHOOK_SECRET: z.string().optional(),
    // The monthly plan's price id (price_...). Swap it to change the price; the pricing page reads
    // the amount from it.
    STRIPE_PRICE_ID: z.string().optional(),
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
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    R2_ACCOUNT_ID: process.env.R2_ACCOUNT_ID,
    R2_ACCESS_KEY_ID: process.env.R2_ACCESS_KEY_ID,
    R2_SECRET_ACCESS_KEY: process.env.R2_SECRET_ACCESS_KEY,
    R2_BUCKET: process.env.R2_BUCKET,
    R2_PUBLIC_URL: process.env.R2_PUBLIC_URL,
    GROCERY_TOKEN_SECRET: process.env.GROCERY_TOKEN_SECRET,
    INSTACART_API_KEY: process.env.INSTACART_API_KEY,
    INSTACART_API_URL: process.env.INSTACART_API_URL,
    KROGER_CLIENT_ID: process.env.KROGER_CLIENT_ID,
    KROGER_CLIENT_SECRET: process.env.KROGER_CLIENT_SECRET,
    KROGER_API_URL: process.env.KROGER_API_URL,
    WALMART_AFFILIATE_LINK: process.env.WALMART_AFFILIATE_LINK,
    R2_BOOK_BUCKET: process.env.R2_BOOK_BUCKET,
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
    STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
    STRIPE_PRICE_ID: process.env.STRIPE_PRICE_ID,
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
