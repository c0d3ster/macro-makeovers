'use client'

import { useEffect, useState } from 'react'

import { createClient } from '@/libs/supabase/client'

import { useAuth } from './AuthContext'

type OwnerCheck = {
  userId: string
  isOwner: boolean
}

// Whether the signed-in user is the site owner, asked of the database through the same
// public.is_owner() the row-level security policies use. It runs in the browser on purpose:
// public recipe pages are cached, and a server-side check would read cookies and make every
// one of them uncacheable. Signed-out visitors, and the moment before the answer arrives, are
// not owners.
export const useIsOwner = (): boolean => {
  const { user } = useAuth()
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

  return check?.userId === userId && check?.isOwner === true
}
