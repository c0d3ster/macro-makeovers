import type { SupabaseClient } from '@supabase/supabase-js'

import { createClient } from '@supabase/supabase-js'

import { requireEnv } from '@/libs/Env'

import type { Database } from './database.types'

// Anonymous client for public reads. It never touches cookies, so pages that use it can be
// statically rendered and revalidated, and row-level security only ever shows published rows.
export const createPublicClient = (): SupabaseClient<Database> =>
  createClient<Database>(
    requireEnv.NEXT_PUBLIC_SUPABASE_URL(),
    requireEnv.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY(),
    { auth: { persistSession: false, autoRefreshToken: false } }
  )
