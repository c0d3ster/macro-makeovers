'use client'

import Link from 'next/link'

import { SignOutButton } from '@/components/molecules'
import { Env } from '@/libs/Env'
import { isSupabaseConfigured } from '@/libs/supabase/client'
import { useAuth } from '@/providers'

export type NavItem = {
  label: string
  href: string
  id: string
  hideOnMobile?: boolean
}

type SiteHeaderProps = {
  menuItems: NavItem[]
  activeItem?: string
  logoUrl?: string
}

const NavAuthSection = () => {
  const { user, isLoaded } = useAuth()

  if (!isLoaded) return null

  return user ? (
    <SignOutButton />
  ) : (
    <Link href='/login' className='text-sm text-text-muted hover:text-primary'>
      Sign In
    </Link>
  )
}

export const SiteHeader = ({
  menuItems,
  activeItem = 'home',
  logoUrl,
}: SiteHeaderProps) => {
  const authEnabled = isSupabaseConfigured()

  return (
    <header className='fixed inset-x-0 top-0 z-50 border-b border-gray-200 bg-surface shadow-lg'>
      <div className='mx-auto max-w-7xl px-4 sm:px-6 lg:px-8'>
        <div className='flex h-16 items-center justify-between'>
          {/* Logo */}
          <div className='flex flex-1 items-center'>
            <Link href='/'>
              {logoUrl ? (
                <img src={logoUrl} alt='Logo' className='h-12 w-auto' />
              ) : (
                <span className='text-base font-semibold whitespace-nowrap text-text sm:text-lg'>
                  {Env.NEXT_PUBLIC_BRAND_NAME}
                </span>
              )}
            </Link>
          </div>

          {/* Navigation */}
          <nav className='flex space-x-4 sm:space-x-8'>
            {menuItems.map((item) => {
              const isActive = activeItem === item.id
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={`text-sm font-medium transition-colors ${isActive ? 'text-primary' : 'text-text-muted hover:text-primary'} ${item.hideOnMobile ? 'hidden sm:block' : ''}`}
                >
                  {item.label}
                </Link>
              )
            })}
          </nav>

          {/* Auth */}
          <div className='flex flex-1 items-center justify-end'>
            {authEnabled && <NavAuthSection />}
          </div>
        </div>
      </div>
    </header>
  )
}
