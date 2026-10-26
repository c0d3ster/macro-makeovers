import type { NextRequest } from 'next/server'

import { NextResponse } from 'next/server'

import { logger } from '@/libs/Logger'
import { createClient } from '@/libs/supabase/server'
import { getSafeRedirectPath } from '@/utils/Redirect'

// Landing point for email confirmation and OAuth redirects: swaps the code for a session cookie
export const GET = async (request: NextRequest): Promise<NextResponse> => {
  const { searchParams, origin } = request.nextUrl
  const code = searchParams.get('code')
  const next = getSafeRedirectPath(searchParams.get('next'))

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) return NextResponse.redirect(`${origin}${next}`)

    logger.error('Auth code exchange failed', { error: error.message })
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`)
}
