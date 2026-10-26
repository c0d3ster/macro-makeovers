import type { SupabaseClient } from '@supabase/supabase-js'

import { createBrowserClient } from '@supabase/ssr'

export const isSupabaseConfigured = (): boolean =>
  Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  )

// Browser client. Safe to call repeatedly: @supabase/ssr returns a singleton in the browser
export const createClient = (): SupabaseClient =>
  createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? ''
  )
