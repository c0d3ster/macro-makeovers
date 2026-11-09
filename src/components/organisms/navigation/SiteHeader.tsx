'use client'

import Image from 'next/image'
import Link from 'next/link'

import type { NavLink } from '@/components/molecules'

import {
  BasketNavLink,
  MobileNav,
  NavDropdown,
  ThemeToggle,
  UserMenu,
} from '@/components/molecules'
import { Env } from '@/libs/Env'
import { isSupabaseConfigured } from '@/libs/supabase/client'
import { useAuth, useOwnerStatus } from '@/providers'

export type NavItem = {
  label: string
  href: string
  id: string
  // Only shown to the site owner
  ownerOnly?: boolean
  // Sub-pages shown in a menu on wider screens, like the guides
  children?: NavLink[]
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
    <UserMenu />
  ) : (
    <Link
      href='/login'
      className='px-1.5 text-sm whitespace-nowrap text-header-muted hover:text-header-text'
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
  const ownerStatus = useOwnerStatus()
  // While the owner check is pending the whole nav stays out of sight, then every link fades in
  // together. The owner-only links already take their space, so nothing shifts.
  const items = menuItems.filter(
    ({ ownerOnly }) => !ownerOnly || ownerStatus !== 'visitor'
  )
  const isNavHeld =
    ownerStatus === 'pending' && menuItems.some(({ ownerOnly }) => ownerOnly)
  // The phone panel is closed while the check runs, so it can simply wait for a yes
  const mobileItems = menuItems.filter(
    ({ ownerOnly }) => !ownerOnly || ownerStatus === 'owner'
  )

  return (
    <header className='fixed inset-x-0 top-0 z-50 border-b border-header-muted/20 bg-header shadow-lg'>
      <div className='mx-auto max-w-7xl px-4 sm:px-6 lg:px-8'>
        <div className='flex h-16 items-center justify-between gap-4'>
          {/* Logo */}
          <div className='-ml-1.5 flex shrink-0 items-center gap-1 sm:ml-0 sm:flex-1'>
            <MobileNav items={mobileItems} activeItem={activeItem} />
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

          {/* Navigation, from sm up. Phones use the MobileNav panel. */}
          <nav
            aria-hidden={isNavHeld || undefined}
            className={`hidden space-x-8 transition-opacity duration-300 sm:flex ${isNavHeld ? 'pointer-events-none opacity-0' : 'opacity-100'}`}
          >
            {items.map((item) => {
              const isActive = activeItem === item.id
              const className = `text-sm font-medium transition-colors ${isActive ? 'text-header-text' : 'text-header-muted hover:text-header-text'}`
              const tabIndex = isNavHeld ? -1 : undefined
              if (item.children) {
                return (
                  <NavDropdown
                    key={item.label}
                    label={item.label}
                    href={item.href}
                    items={item.children}
                    className={className}
                    tabIndex={tabIndex}
                  />
                )
              }
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  tabIndex={tabIndex}
                  className={className}
                >
                  {item.label}
                </Link>
              )
            })}
          </nav>

          {/* Auth */}
          <div className='flex shrink-0 items-center justify-end gap-1 sm:flex-1 sm:gap-3'>
            <BasketNavLink />
            <ThemeToggle />
            {authEnabled && <NavAuthSection />}
          </div>
        </div>
      </div>
    </header>
  )
}
