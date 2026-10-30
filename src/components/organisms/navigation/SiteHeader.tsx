'use client'

import Image from 'next/image'
import Link from 'next/link'

import { SignOutButton, ThemeToggle } from '@/components/molecules'
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

const DEFAULT_LOGO = '/logo.png'

const NavAuthSection = () => {
  const { user, isLoaded } = useAuth()

  if (!isLoaded) return null

  return user ? (
    <SignOutButton />
  ) : (
    <Link
      href='/login'
      className='text-sm whitespace-nowrap text-header-muted hover:text-header-text'
    >
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
    <header className='fixed inset-x-0 top-0 z-50 border-b border-header-muted/20 bg-header shadow-lg'>
      <div className='mx-auto max-w-7xl px-4 sm:px-6 lg:px-8'>
        <div className='flex h-16 items-center justify-between gap-3'>
          {/* Logo */}
          <div className='flex shrink-0 items-center sm:flex-1'>
            <Link
              href='/'
              aria-label={Env.NEXT_PUBLIC_BRAND_NAME}
              className='flex items-center gap-3'
            >
              {/* The name sits beside the mark (hidden on phones), so the image is decorative */}
              <Image
                src={logoUrl ?? DEFAULT_LOGO}
                alt=''
                width={411}
                height={554}
                priority
                className='h-10 w-auto'
              />
              <span className='hidden text-lg font-semibold whitespace-nowrap text-header-text sm:inline'>
                {Env.NEXT_PUBLIC_BRAND_NAME}
              </span>
            </Link>
          </div>

          {/* Navigation */}
          <nav className='ml-auto flex space-x-3 sm:ml-0 sm:space-x-8'>
            {menuItems.map((item) => {
              const isActive = activeItem === item.id
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={`text-sm font-medium transition-colors ${isActive ? 'text-header-text' : 'text-header-muted hover:text-header-text'} ${item.hideOnMobile ? 'hidden sm:block' : ''}`}
                >
                  {item.label}
                </Link>
              )
            })}
          </nav>

          {/* Auth */}
          <div className='flex shrink-0 items-center justify-end gap-2 sm:flex-1 sm:gap-4'>
            <ThemeToggle />
            {authEnabled && <NavAuthSection />}
          </div>
        </div>
      </div>
    </header>
  )
}
