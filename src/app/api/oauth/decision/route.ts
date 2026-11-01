import type { SupabaseClient } from '@supabase/supabase-js'
import type { NextRequest } from 'next/server'

import { NextResponse } from 'next/server'

import type { Database } from '@/libs/supabase/database.types'

import { logger } from '@/libs/Logger'
import { isAllowedRedirectUri } from '@/libs/mcp/allowedClients'
import { isOwner } from '@/libs/supabase/owner'
import { createClient } from '@/libs/supabase/server'

// Looked up again here because the consent page's check can be skipped by posting directly
const hasAllowedRedirect = async (
  supabase: SupabaseClient<Database>,
  authorizationId: string
): Promise<boolean> => {
  const { data } =
    await supabase.auth.oauth.getAuthorizationDetails(authorizationId)

  return !!data && 'redirect_uri' in data && isAllowedRedirectUri(data.redirect_uri)
}

// Records the owner's decision with Supabase, then sends the browser back to the app
export const POST = async (request: NextRequest): Promise<NextResponse> => {
  const form = await request.formData()
  const authorizationId = form.get('authorization_id')
  const decision = form.get('decision')
  if (
    typeof authorizationId !== 'string' ||
    !authorizationId ||
    (decision !== 'approve' && decision !== 'deny')
  ) {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 })
  }

  if (!(await isOwner())) {
    return NextResponse.json(
      { error: 'Only the site owner can connect apps.' },
      { status: 403 }
    )
  }

  const supabase = await createClient()
  const approve =
    decision === 'approve' &&
    (await hasAllowedRedirect(supabase, authorizationId))

  const { data, error } = approve
    ? await supabase.auth.oauth.approveAuthorization(authorizationId)
    : await supabase.auth.oauth.denyAuthorization(authorizationId)

  if (error || !data) {
    logger.error('OAuth decision failed', { error: error?.message })
    return NextResponse.json(
      { error: 'Could not record the decision. Start again.' },
      { status: 400 }
    )
  }

  // 303 so the browser follows with a GET instead of re-posting the form to the app
  return NextResponse.redirect(data.redirect_url, 303)
}
