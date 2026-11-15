import type { NextRequest } from 'next/server'

import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

import { krogerAuthorizeUrl } from '@/libs/grocery'
import {
  availableGrocers,
  krogerCredentials,
  krogerRedirectUri,
} from '@/libs/grocery/groceryConfig'
import { cookieOptions, KROGER_STATE_COOKIE } from '@/libs/grocery/krogerSession'
import { getAuthId } from '@/libs/supabase/server'

const STATE_MAX_AGE = 60 * 10

// Starts Kroger sign-in so "Send to cart" can add to the member's own Kroger cart. The state
// cookie ties the callback to this browser.
export const GET = async (request: NextRequest): Promise<NextResponse> => {
  const { origin } = request.nextUrl
  const credentials = krogerCredentials()
  if (!credentials || !availableGrocers().includes('kroger'))
    return NextResponse.redirect(`${origin}/basket`)
  if (!(await getAuthId()))
    return NextResponse.redirect(`${origin}/login?next=/basket`)

  const state = crypto.randomUUID()
  ;(await cookies()).set(KROGER_STATE_COOKIE, state, cookieOptions(STATE_MAX_AGE))
  return NextResponse.redirect(
    krogerAuthorizeUrl({
      clientId: credentials.clientId,
      redirectUri: krogerRedirectUri(),
      state,
      ...(credentials.baseUrl ? { baseUrl: credentials.baseUrl } : {}),
    })
  )
}
