import type { SupabaseClient } from '@supabase/supabase-js'

import { createClient } from '@supabase/supabase-js'

import { requireEnv } from '@/libs/Env'

import type { Database } from './database.types'

// Service role client. It bypasses RLS, so use it only on the server (route
// handlers, server actions, scripts) and only after checking who is asking.
// Never import it from client components.
export const createAdminClient = (): SupabaseClient<Database> =>
  createClient<Database>(
    requireEnv.NEXT_PUBLIC_SUPABASE_URL(),
    requireEnv.SUPABASE_SECRET_KEY(),
    { auth: { persistSession: false, autoRefreshToken: false } }
  )
