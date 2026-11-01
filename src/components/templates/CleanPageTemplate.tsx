import type { ReactNode } from 'react'

import { SiteHeader } from '@/components/organisms'

import { ACCOUNT_NAV_ITEMS } from './siteNav'

// The signed-in pages (account and admin). Their header has the account links, and no
// scroll-to-section tracking like the public pages.
type CleanPageTemplateProps = {
  children: ReactNode
  title: string
  subtitle?: string
  header?: ReactNode
  // Which nav link to mark as the current page, like 'account'
  activeItem?: string
}

export const CleanPageTemplate = ({
  children,
  title,
  subtitle,
  header,
  activeItem = '',
}: CleanPageTemplateProps) => {
  return (
    <div className='min-h-screen'>
      <SiteHeader menuItems={ACCOUNT_NAV_ITEMS} activeItem={activeItem} />
      <div className='mx-auto max-w-4xl px-4 pt-24 pb-8'>
        {/* Header */}
        <div className='mb-8 flex items-center justify-between'>
          <div>
            <h1 className='text-3xl font-bold text-text'>{title}</h1>
            {subtitle && <p className='text-text-muted'>{subtitle}</p>}
          </div>
          {header}
        </div>

        {/* Content */}
        {children}
      </div>
    </div>
  )
}
