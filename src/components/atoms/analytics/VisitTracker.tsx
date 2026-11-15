'use client'

import { useEffect } from 'react'

import {
  directTrafficSource,
  readTrafficSource,
  readTrafficSourceCookie,
  track,
  writeTrafficSourceCookie,
} from '@/libs/analytics'

const VISIT_KEY = 'mm_visit_tracked'

// Session storage can be blocked, in which case each page load counts as a visit
const isFirstPageOfVisit = (): boolean => {
  try {
    if (sessionStorage.getItem(VISIT_KEY)) return false
    sessionStorage.setItem(VISIT_KEY, '1')
    return true
  } catch {
    return true
  }
}

// Records where the visitor came from and counts one visit per browser session. A new UTM
// link or outside referrer replaces the stored source; a direct visit keeps it.
export const VisitTracker = (): null => {
  useEffect(() => {
    const url = new URL(window.location.href)
    const fresh = readTrafficSource(url, document.referrer)
    const stored = readTrafficSourceCookie()
    const current = fresh ?? stored ?? directTrafficSource(url.pathname)
    if (fresh || !stored) writeTrafficSourceCookie(current)

    if (!isFirstPageOfVisit()) return
    track('visit', {
      source: fresh?.source ?? 'direct',
      medium: fresh?.medium,
      campaign: fresh?.campaign,
      path: url.pathname,
    })
  }, [])

  return null
}
