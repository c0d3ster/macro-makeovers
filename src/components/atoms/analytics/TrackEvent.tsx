'use client'

import { useEffect } from 'react'

import type { AnalyticsEvent, AnalyticsEventProperties } from '@/libs/analytics'

import { track } from '@/libs/analytics'

type TrackEventProps<E extends AnalyticsEvent> = {
  event: E
  properties: AnalyticsEventProperties[E]
}

// track's tuple typing cannot be checked against a generic event, and the props above already are
const send = track as (event: AnalyticsEvent, properties: object) => void

// Sends one event when it mounts, so a server-rendered page can count a view
export const TrackEvent = <E extends AnalyticsEvent>({
  event,
  properties,
}: TrackEventProps<E>): null => {
  // A stable key, so a re-render with equal properties does not count twice
  const key = JSON.stringify(properties)

  useEffect(() => {
    send(event, JSON.parse(key) as object)
  }, [event, key])

  return null
}
