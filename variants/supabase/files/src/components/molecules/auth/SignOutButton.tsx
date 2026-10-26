'use client'

import { useAuth } from '@/providers'

export const SignOutButton = () => {
  const { signOut } = useAuth()

  return (
    <button
      type='button'
      onClick={signOut}
      className='text-sm text-text-muted hover:text-primary'
    >
      Sign Out
    </button>
  )
}
