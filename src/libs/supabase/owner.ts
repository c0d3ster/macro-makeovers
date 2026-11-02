import { createClient as createSupabaseClient } from '@supabase/supabase-js'

import { requireEnv } from '@/libs/Env'

import type { Database } from './database.types'

import { createClient } from './server'

// Whether the signed-in user is the site owner, decided by the database (public.is_owner),
// the same check the RLS policies use. Signed-out visitors and members get false.
// GraphQL resolvers call this before any recipe write or draft read, because the Drizzle
// connection bypasses RLS.
export const isOwner = async (): Promise<boolean> => {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('is_owner')
  return !error && data === true
}

// The same check for a caller that sends a bearer token instead of cookies (the MCP route).
// The call runs as the token's user, so the database still decides.
export const isOwnerForToken = async (token: string): Promise<boolean> => {
  const supabase = createSupabaseClient<Database>(
    requireEnv.NEXT_PUBLIC_SUPABASE_URL(),
    requireEnv.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY(),
    {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { persistSession: false, autoRefreshToken: false },
    }
  )
  const { data, error } = await supabase.rpc('is_owner')
  return !error && data === true
}
