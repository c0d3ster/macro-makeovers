'use client'

import type { ReactNode } from 'react'

import type { NavItem } from '@/components/organisms'

import { SiteHeader } from '@/components/organisms'

import { useActiveNavItem } from './useActiveNavItem'

type LandingPageTemplateProps = {
  children: ReactNode
  logoUrl?: string
}

const menuItems: NavItem[] = [
  { id: 'home', label: 'Home', href: '/' },
  { id: 'contact', label: 'Contact', href: '/#contact' },
]

export const LandingPageTemplate = ({
  children,
  logoUrl,
}: LandingPageTemplateProps) => {
  const activeItem = useActiveNavItem()

  return (
    <div className='min-h-screen scroll-smooth bg-background'>
      <SiteHeader
        menuItems={menuItems}
        activeItem={activeItem}
        logoUrl={logoUrl}
      />
      <div className='pt-16'>{children}</div>
    </div>
  )
}
