import type { SupabaseClient } from '@supabase/supabase-js'

import { createBrowserClient } from '@supabase/ssr'

import type { Database } from './database.types'

export const isSupabaseConfigured = (): boolean =>
  Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  )

// Browser client. Safe to call repeatedly: @supabase/ssr returns a singleton in the browser
export const createClient = (): SupabaseClient<Database> =>
  createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? ''
  )
