import type { ReactElement, ReactNode } from 'react'

import { SiteHeader } from '@/components/organisms'

import { SITE_NAV_ITEMS } from './siteNav'

type LandingPageTemplateProps = {
  children: ReactNode
  logoUrl?: string
  // Which nav link to mark as the current page, like 'recipes'
  activeItem?: string
}

export const LandingPageTemplate = ({
  children,
  logoUrl,
  activeItem = '',
}: LandingPageTemplateProps): ReactElement => (
  <div className='min-h-screen scroll-smooth'>
    <SiteHeader
      menuItems={SITE_NAV_ITEMS}
      activeItem={activeItem}
      logoUrl={logoUrl}
    />
    <div className='pt-16'>{children}</div>
  </div>
)
