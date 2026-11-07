import type { ReactElement, ReactNode } from 'react'

import { SiteHeader } from '@/components/organisms'

import { ACCOUNT_NAV_ITEMS } from './siteNav'

type RecipeEditorTemplateProps = {
  // Read by screen readers only, because the recipe's own title field fills that spot
  title: string
  // The band under the header: back link on the left, status and actions on the right
  toolbarStart: ReactNode
  toolbarEnd?: ReactNode
  children: ReactNode
}

// The owner's pages for writing a recipe. Full recipe-page width, with the admin header.
export const RecipeEditorTemplate = ({
  title,
  toolbarStart,
  toolbarEnd,
  children,
}: RecipeEditorTemplateProps): ReactElement => (
  <div className='min-h-screen'>
    <SiteHeader menuItems={ACCOUNT_NAV_ITEMS} activeItem='manage' />
    <div className='pt-16'>
      <h1 className='sr-only'>{title}</h1>
      <div className='border-b border-text-muted/20 bg-surface'>
        <div className='mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-3 py-3 sm:px-6 lg:px-8'>
          <div className='flex flex-col gap-1 text-sm text-text-muted'>
            {toolbarStart}
          </div>
          {toolbarEnd}
        </div>
      </div>
      {children}
    </div>
  </div>
)
