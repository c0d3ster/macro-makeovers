'use client'

import type { ReactNode } from 'react'

import type { NavItem } from '@/components/organisms'

import { SiteHeader } from '@/components/organisms'

import { useActiveNavItem } from './useActiveNavItem' // @module:email

type LandingPageTemplateProps = {
  children: ReactNode
  logoUrl?: string
}

const menuItems: NavItem[] = [
  { id: 'home', label: 'Home', href: '/' },
  { id: 'contact', label: 'Contact', href: '/#contact' }, // @module:email
]

export const LandingPageTemplate = ({ children, logoUrl }: LandingPageTemplateProps) => {
  const activeItem = useActiveNavItem() // @module:email

  return (
    <div className='min-h-screen scroll-smooth bg-background'>
      <SiteHeader
        menuItems={menuItems}
        activeItem={activeItem} // @module:email
        logoUrl={logoUrl}
      />
      <div className='pt-16'>{children}</div>
    </div>
  )
}
