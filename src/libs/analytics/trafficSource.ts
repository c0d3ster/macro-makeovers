import type { SourceProperties } from './funnelEvents'

// Where a visitor came from, kept in a first-party cookie so sign-up can store it on the user
export type TrafficSource = SourceProperties & {
  // The external site that linked here, as a host like 'www.reddit.com'
  referrer?: string
  // The first page seen on this visit, like '/recipes/smash-burgers'
  landingPath: string
}

export const TRAFFIC_SOURCE_COOKIE = 'mm_traffic_source'
// Thirty days, so a visitor who signs up a few visits later still credits the channel
export const TRAFFIC_SOURCE_MAX_AGE = 60 * 60 * 24 * 30

const MAX_LENGTH = 255

const clip = (value: string | null | undefined): string | undefined => {
  const trimmed = value?.trim()
  return trimmed ? trimmed.slice(0, MAX_LENGTH) : undefined
}

const externalHost = (referrer: string, ownHost: string): string | undefined => {
  try {
    const { host } = new URL(referrer)
    return host && host !== ownHost ? clip(host) : undefined
  } catch {
    return undefined
  }
}

// Reads UTM tags first, then the referring site. Returns undefined for a direct or internal
// visit, so the caller keeps whatever source an earlier visit recorded.
export const readTrafficSource = (
  url: URL,
  referrer: string
): TrafficSource | undefined => {
  const params = url.searchParams
  const utmSource = clip(params.get('utm_source'))
  const referrerHost = externalHost(referrer, url.host)
  if (!utmSource && !referrerHost) return undefined

  const source: TrafficSource = {
    source: utmSource ?? referrerHost ?? 'direct',
    medium: clip(params.get('utm_medium')) ?? (utmSource ? undefined : 'referral'),
    campaign: clip(params.get('utm_campaign')),
    referrer: referrerHost,
    landingPath: clip(url.pathname) ?? '/',
  }
  return source
}

// A visit with no source and nothing stored counts as direct
export const directTrafficSource = (landingPath: string): TrafficSource => ({
  source: 'direct',
  landingPath: clip(landingPath) ?? '/',
})

export const serializeTrafficSource = (source: TrafficSource): string =>
  encodeURIComponent(JSON.stringify(source))

const optionalText = (value: unknown): string | undefined =>
  typeof value === 'string' ? clip(value) : undefined

// The cookie is visitor-controlled, so anything malformed reads as no source at all
export const parseTrafficSource = (
  value: string | undefined
): TrafficSource | undefined => {
  if (!value) return undefined
  try {
    const parsed: unknown = JSON.parse(decodeURIComponent(value))
    if (!parsed || typeof parsed !== 'object') return undefined
    const record = parsed as Record<string, unknown>
    const source = optionalText(record.source)
    if (!source) return undefined
    return {
      source,
      medium: optionalText(record.medium),
      campaign: optionalText(record.campaign),
      referrer: optionalText(record.referrer),
      landingPath: optionalText(record.landingPath) ?? '/',
    }
  } catch {
    return undefined
  }
}

// Reads the stored source in the browser
export const readTrafficSourceCookie = (): TrafficSource | undefined => {
  if (typeof document === 'undefined') return undefined
  const match = document.cookie
    .split('; ')
    .find((part) => part.startsWith(`${TRAFFIC_SOURCE_COOKIE}=`))
  return parseTrafficSource(match?.slice(TRAFFIC_SOURCE_COOKIE.length + 1))
}

export const writeTrafficSourceCookie = (source: TrafficSource): void => {
  document.cookie = `${TRAFFIC_SOURCE_COOKIE}=${serializeTrafficSource(source)}; path=/; max-age=${TRAFFIC_SOURCE_MAX_AGE}; samesite=lax${location.protocol === 'https:' ? '; secure' : ''}`
}
