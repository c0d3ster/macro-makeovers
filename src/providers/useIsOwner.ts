'use client'

import { useEffect, useState } from 'react'

import { createClient } from '@/libs/supabase/client'

import { useAuth } from './AuthContext'

type OwnerCheck = {
  userId: string
  isOwner: boolean
}

export type OwnerStatus = 'pending' | 'owner' | 'visitor'

// Whether the signed-in user is the site owner, asked of the database through the same
// public.is_owner() the row-level security policies use. It runs in the browser on purpose:
// public recipe pages are cached, and a server-side check would read cookies and make every
// one of them uncacheable. 'pending' covers the moment before the session and the answer
// arrive, so a header can hold a place for owner-only links instead of jumping when they show.
export const useOwnerStatus = (): OwnerStatus => {
  const { user, isLoaded } = useAuth()
  const userId = user?.id
  const [check, setCheck] = useState<OwnerCheck>()

  useEffect(() => {
    if (!userId) return undefined

    let isCurrent = true
    void createClient()
      .rpc('is_owner')
      .then(({ data, error }) => {
        if (isCurrent) setCheck({ userId, isOwner: !error && data === true })
      })

    return () => {
      isCurrent = false
    }
  }, [userId])

  if (!isLoaded) return 'pending'
  if (!userId) return 'visitor'
  if (check?.userId !== userId) return 'pending'
  return check.isOwner ? 'owner' : 'visitor'
}

// Signed-out visitors, and the moment before the answer arrives, are not owners
export const useIsOwner = (): boolean => useOwnerStatus() === 'owner'
