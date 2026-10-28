import type { SupabaseClient } from '@supabase/supabase-js'

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

import { requireEnv } from '@/libs/Env'

import type { Database } from './database.types'

// Server client for Server Components, Route Handlers and Server Actions
export const createClient = async (): Promise<SupabaseClient<Database>> => {
  const cookieStore = await cookies()

  return createServerClient<Database>(
    requireEnv.NEXT_PUBLIC_SUPABASE_URL(),
    requireEnv.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY(),
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet): void => {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Called from a Server Component, where cookies are read-only.
            // Safe to ignore because the proxy refreshes the session.
          }
        },
      },
    }
  )
}

// Supabase auth id (auth.users.id) of the current request, or undefined when signed out.
// getClaims verifies the JWT locally, so it does not hit the Supabase Auth server each call.
export const getAuthId = async (): Promise<string | undefined> => {
  const supabase = await createClient()
  const { data } = await supabase.auth.getClaims()
  return data?.claims.sub
}
