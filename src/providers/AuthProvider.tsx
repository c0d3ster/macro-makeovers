'use client'

import type { User } from '@supabase/supabase-js'
import type { ReactNode } from 'react'

import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'

import { createClient, isSupabaseConfigured } from '@/libs/supabase/client'

import type { AuthContextValue } from './AuthContext'

import { AuthContext } from './AuthContext'

type AuthProviderProps = {
  children: ReactNode
}

export const AuthProvider = ({ children }: AuthProviderProps): ReactNode => {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [isLoaded, setIsLoaded] = useState(() => !isSupabaseConfigured())

  useEffect((): (() => void) | void => {
    // Skip auth when Supabase is not configured
    if (!isSupabaseConfigured()) return

    const supabase = createClient()
    // Fires INITIAL_SESSION on subscribe, then on every sign in, sign out and token refresh
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session): void => {
      setUser(session?.user ?? null)
      setIsLoaded(true)
    })

    return (): void => subscription.unsubscribe()
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isLoaded,
      signOut: async (): Promise<void> => {
        await createClient().auth.signOut()
        router.push('/')
        router.refresh()
      },
    }),
    [user, isLoaded, router]
  )

  return <AuthContext value={value}>{children}</AuthContext>
}
