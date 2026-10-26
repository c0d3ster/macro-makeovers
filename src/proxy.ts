import type { NextFetchEvent, NextRequest } from 'next/server'

import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

const isProtectedRoute = createRouteMatcher(['/profile(.*)'])

export default async function proxy(
  request: NextRequest,
  event: NextFetchEvent
) {
  // Skip Clerk middleware when secret key is not configured
  if (!process.env.CLERK_SECRET_KEY) {
    return NextResponse.next()
  }

  // Run Clerk middleware for ALL routes to enable auth() in API routes
  return clerkMiddleware(async (auth, req) => {
    // Only protect profile routes
    if (isProtectedRoute(req)) {
      await auth.protect()
    }

    return NextResponse.next()
  })(request, event)
}

export const config = {
  // Match all pathnames except for
  // - webhook endpoints (they handle their own auth)
  // - … if they start with `/_next` or `/_vercel`
  // - … the ones containing a dot (e.g. `favicon.ico`)
  matcher: '/((?!api/webhook|_next|_vercel|monitoring|.*\\..*).*)',
}
