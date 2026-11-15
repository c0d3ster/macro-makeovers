import type { HandoffErrorCode } from './groceryTypes'

import { HandoffError } from './groceryTypes'

// The slice of fetch the adapters use, so tests can pass a mock
export type FetchLike = (
  input: string,
  init?: RequestInit
) => Promise<Response>

// Grocer APIs can hang. A handoff should fail with a message, not spin.
const TIMEOUT_MS = 10_000

type JsonRequest = {
  fetcher: FetchLike
  url: string
  init?: RequestInit
  // What the member sees if the call fails
  failure: string
  // The code a 401 or 403 maps to. Defaults to GROCER_UNAVAILABLE.
  authCode?: HandoffErrorCode
}

// Calls a grocer API and parses the JSON. Every failure becomes a HandoffError with a message
// the member can read. The response body is never echoed, since it can hold request details.
export const requestJson = async <T>({
  fetcher,
  url,
  init,
  failure,
  authCode = 'GROCER_UNAVAILABLE',
}: JsonRequest): Promise<T | undefined> => {
  let response: Response
  try {
    response = await fetcher(url, {
      ...init,
      signal: init?.signal ?? AbortSignal.timeout(TIMEOUT_MS),
    })
  } catch {
    throw new HandoffError('GROCER_UNAVAILABLE', failure)
  }
  if (response.status === 401 || response.status === 403)
    throw new HandoffError(authCode, failure)
  if (!response.ok) throw new HandoffError('GROCER_UNAVAILABLE', failure)
  // 204 and other empty bodies, like Kroger's cart add
  const text = await response.text()
  if (!text) return undefined
  try {
    return JSON.parse(text) as T
  } catch {
    throw new HandoffError('GROCER_UNAVAILABLE', failure)
  }
}
