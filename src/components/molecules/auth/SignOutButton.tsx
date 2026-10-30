'use client'

import { useAuth } from '@/providers'

export const SignOutButton = () => {
  const { signOut } = useAuth()

  return (
    <button
      type='button'
      onClick={signOut}
      className='text-sm whitespace-nowrap text-header-muted hover:text-header-text'
    >
      Sign Out
    </button>
  )
}
