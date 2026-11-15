import type { User } from '@supabase/supabase-js'
import type { NextRequest } from 'next/server'

import { NextResponse } from 'next/server'

import {
  directTrafficSource,
  parseTrafficSource,
  TRAFFIC_SOURCE_COOKIE,
} from '@/libs/analytics'
import { trackServer } from '@/libs/analytics/trackServer'
import { logger } from '@/libs/Logger'
import { createClient } from '@/libs/supabase/server'
import { services } from '@/services'
import { getSafeRedirectPath } from '@/utils/Redirect'

// An account this young on its first callback was just created, not an old user signing in
// before sign-up sources were recorded
const NEW_ACCOUNT_MS = 10 * 60 * 1000

const isNewAccount = ({ created_at: createdAt }: User): boolean =>
  Date.now() - new Date(createdAt).getTime() < NEW_ACCOUNT_MS

// Google sign-ups carry no metadata, so their traffic source is stored here from the visitor
// cookie. Email sign-ups stored theirs at sign-up and were counted in the browser, so the
// write finds nothing to fill and no event is sent twice.
const recordSignupSource = async (
  request: NextRequest,
  user: User
): Promise<void> => {
  if (!isNewAccount(user)) return
  try {
    const source =
      parseTrafficSource(request.cookies.get(TRAFFIC_SOURCE_COOKIE)?.value) ??
      directTrafficSource('/login')
    const recorded = await services.userService.recordSignupSource(
      user.id,
      source
    )
    if (!recorded) return
    await trackServer(
      'sign_up',
      {
        method: user.app_metadata.provider === 'google' ? 'google' : 'email',
        source: source.source,
        medium: source.medium,
        campaign: source.campaign,
      },
      { request }
    )
  } catch (error) {
    // Never block the sign-in on analytics
    logger.error('Could not record the sign-up source', { error: String(error) })
  }
}

// Landing point for email confirmation and OAuth redirects: swaps the code for a session cookie
export const GET = async (request: NextRequest): Promise<NextResponse> => {
  const { searchParams, origin } = request.nextUrl
  const code = searchParams.get('code')
  const next = getSafeRedirectPath(searchParams.get('next'))

  if (code) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      if (data.user) await recordSignupSource(request, data.user)
      return NextResponse.redirect(`${origin}${next}`)
    }

    logger.error('Auth code exchange failed', { error: error.message })
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`)
}
