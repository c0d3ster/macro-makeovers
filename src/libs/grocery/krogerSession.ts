import { cookies } from 'next/headers'

import type { KrogerCredentials, KrogerTokens } from './krogerApi'

import { refreshKrogerTokens } from './krogerApi'
import { sealValue, unsealValue } from './tokenSeal'

// The member's Kroger tokens live in a sealed httpOnly cookie on their device, not in the
// database. Clearing cookies or switching devices just means connecting Kroger again.
export const KROGER_TOKEN_COOKIE = 'mm_kroger'
// Short-lived state for the OAuth round trip, checked on the callback
export const KROGER_STATE_COOKIE = 'mm_kroger_state'

// Kroger refresh tokens last months. The cookie outlives a few of them; a dead one just asks the
// member to connect again.
const TOKEN_COOKIE_MAX_AGE = 60 * 60 * 24 * 180
const EXPIRY_MARGIN_MS = 60_000

const isTokens = (value: unknown): value is KrogerTokens =>
  typeof value === 'object' &&
  value !== null &&
  typeof (value as KrogerTokens).accessToken === 'string' &&
  typeof (value as KrogerTokens).expiresAt === 'number'

export const cookieOptions = (maxAge: number) =>
  ({
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge,
  }) as const

export const saveKrogerTokens = async (
  tokens: KrogerTokens,
  secret: string
): Promise<void> => {
  const store = await cookies()
  store.set(
    KROGER_TOKEN_COOKIE,
    await sealValue(tokens, secret),
    cookieOptions(TOKEN_COOKIE_MAX_AGE)
  )
}

const readKrogerTokens = async (
  secret: string
): Promise<KrogerTokens | undefined> => {
  const sealed = (await cookies()).get(KROGER_TOKEN_COOKIE)?.value
  if (!sealed) return undefined
  const value = await unsealValue(sealed, secret)
  return isTokens(value) ? value : undefined
}

export const hasKrogerConnection = async (secret: string): Promise<boolean> =>
  (await readKrogerTokens(secret)) !== undefined

// A live access token for the member, refreshed and saved back when it has lapsed. Undefined
// when they have never connected or the refresh failed, which sends them to connect again.
export const getKrogerMemberToken = async (
  credentials: KrogerCredentials,
  secret: string
): Promise<string | undefined> => {
  const tokens = await readKrogerTokens(secret)
  if (!tokens) return undefined
  if (tokens.expiresAt - EXPIRY_MARGIN_MS > Date.now()) return tokens.accessToken
  if (!tokens.refreshToken) return undefined
  try {
    const fresh = await refreshKrogerTokens(credentials, tokens.refreshToken)
    await saveKrogerTokens(fresh, secret)
    return fresh.accessToken
  } catch {
    ;(await cookies()).delete(KROGER_TOKEN_COOKIE)
    return undefined
  }
}
