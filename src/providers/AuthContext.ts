'use client'

import type { User } from '@supabase/supabase-js'

import { createContext, use } from 'react'

export type AuthContextValue = {
  user: User | null
  isLoaded: boolean
  signOut: () => Promise<void>
}

// Default is the signed-out state, so components render fine without a provider
export const AuthContext = createContext<AuthContextValue>({
  user: null,
  isLoaded: true,
  signOut: async (): Promise<void> => {},
})

export const useAuth = (): AuthContextValue => use(AuthContext)
