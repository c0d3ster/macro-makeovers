import type { NextRequest } from 'next/server'

import { NextResponse } from 'next/server'

import { isSupabaseConfigured } from '@/libs/supabase/client'
import { updateSession } from '@/libs/supabase/proxy'

const PROTECTED_PATHS = ['/profile']

const isProtectedPath = (pathname: string): boolean =>
  PROTECTED_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`)
  )

export default async function proxy(
  request: NextRequest
): Promise<NextResponse> {
  // Skip auth when Supabase is not configured
  if (!isSupabaseConfigured()) {
    return NextResponse.next()
  }

  // Run for ALL matched routes so the session cookie stays fresh for API routes too
  const { response, authId } = await updateSession(request)

  if (!authId && isProtectedPath(request.nextUrl.pathname)) {
    const redirectUrl = request.nextUrl.clone()
    const next = `${request.nextUrl.pathname}${request.nextUrl.search}`
    redirectUrl.pathname = '/login'
    redirectUrl.search = ''
    redirectUrl.searchParams.set('next', next)

    const redirect = NextResponse.redirect(redirectUrl)
    // Carry over any refreshed session cookies
    response.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie))
    return redirect
  }

  return response
}

export const config = {
  // Match all pathnames except for
  // - … if they start with `/_next` or `/_vercel`
  // - … the ones containing a dot (e.g. `favicon.ico`)
  matcher: '/((?!_next|_vercel|monitoring|.*\\..*).*)',
}
