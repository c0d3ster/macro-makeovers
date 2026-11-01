'use client'

import type { ReactNode } from 'react'

import { SiteHeader } from '@/components/organisms'

import { SITE_NAV_ITEMS } from './siteNav'
import { useActiveNavItem } from './useActiveNavItem'

type LandingPageTemplateProps = {
  children: ReactNode
  logoUrl?: string
}

export const LandingPageTemplate = ({
  children,
  logoUrl,
}: LandingPageTemplateProps) => {
  const activeItem = useActiveNavItem()

  return (
    <div className='min-h-screen scroll-smooth'>
      <SiteHeader
        menuItems={SITE_NAV_ITEMS}
        activeItem={activeItem}
        logoUrl={logoUrl}
      />
      <div className='pt-16'>{children}</div>
    </div>
  )
}
