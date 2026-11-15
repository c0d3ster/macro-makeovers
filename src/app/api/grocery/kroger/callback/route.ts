import type { NextRequest } from 'next/server'

import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

import { exchangeKrogerCode } from '@/libs/grocery'
import {
  groceryTokenSecret,
  krogerCredentials,
  krogerRedirectUri,
} from '@/libs/grocery/groceryConfig'
import { KROGER_STATE_COOKIE, saveKrogerTokens } from '@/libs/grocery/krogerSession'
import { logger } from '@/libs/Logger'

// Kroger sends the member back here after sign-in: check the state, swap the code for tokens,
// seal them in a cookie, and return to the basket with Kroger picked
export const GET = async (request: NextRequest): Promise<NextResponse> => {
  const { origin, searchParams } = request.nextUrl
  const back = (status: 'connected' | 'failed'): NextResponse =>
    NextResponse.redirect(`${origin}/basket?kroger=${status}`)

  const store = await cookies()
  const expected = store.get(KROGER_STATE_COOKIE)?.value
  store.delete(KROGER_STATE_COOKIE)

  const code = searchParams.get('code')
  const state = searchParams.get('state')
  const credentials = krogerCredentials()
  const secret = groceryTokenSecret()
  if (!code || !state || !expected || state !== expected || !credentials || !secret)
    return back('failed')

  try {
    const tokens = await exchangeKrogerCode(credentials, {
      code,
      redirectUri: krogerRedirectUri(),
    })
    await saveKrogerTokens(tokens, secret)
    return back('connected')
  } catch (error) {
    logger.error('Kroger sign-in failed', { error: String(error) })
    return back('failed')
  }
}
