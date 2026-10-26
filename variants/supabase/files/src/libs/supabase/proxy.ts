import type { NextRequest } from 'next/server'

import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'

import { requireEnv } from '@/libs/Env'

type SessionResult = {
  response: NextResponse
  authId?: string
}

// Refreshes the Supabase session cookie and reports who is signed in.
// Always return `response` (or copy its cookies onto your own) so refreshed tokens reach the browser.
export const updateSession = async (
  request: NextRequest
): Promise<SessionResult> => {
  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    requireEnv.NEXT_PUBLIC_SUPABASE_URL(),
    requireEnv.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY(),
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet): void => {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data } = await supabase.auth.getClaims()

  return { response, authId: data?.claims.sub }
}
