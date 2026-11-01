import { isOwnerForToken } from '@/libs/supabase/owner'
import { createPublicClient } from '@/libs/supabase/public'

export type AccessTokenCheck =
  | { ok: true; authId: string; token: string }
  | { ok: false; reason: 'missing' | 'invalid' | 'forbidden' }

// Pulls the token out of an `Authorization: Bearer <token>` header
export const readBearerToken = (header: string | null): string | undefined => {
  if (!header) return undefined

  const [scheme, token, ...rest] = header.trim().split(/\s+/)
  if (scheme?.toLowerCase() !== 'bearer' || !token || rest.length > 0) {
    return undefined
  }

  return token
}

// Accepts only a token that Supabase issued through its OAuth server for the site owner.
// getClaims checks the signature against the project's public keys.
export const verifyAccessToken = async (
  header: string | null
): Promise<AccessTokenCheck> => {
  const token = readBearerToken(header)
  if (!token) return { ok: false, reason: 'missing' }

  const { data, error } = await createPublicClient().auth.getClaims(token)
  const claims = data?.claims
  if (error || !claims?.sub) return { ok: false, reason: 'invalid' }

  // Tokens from the OAuth server carry the client_id of the app that asked. An ordinary browser
  // session token for the same user does not, so it is not accepted here.
  if (!('client_id' in claims) || typeof claims.client_id !== 'string') {
    return { ok: false, reason: 'invalid' }
  }

  if (!(await isOwnerForToken(token))) return { ok: false, reason: 'forbidden' }

  return { ok: true, authId: claims.sub, token }
}
