import type { Metadata } from 'next'
import type { ReactElement } from 'react'

import { Button } from '@/components/atoms'
import { LandingPageTemplate } from '@/components/templates'

export const metadata: Metadata = {
  title: 'Page not found',
}

const NotFound = (): ReactElement => (
  <LandingPageTemplate>
    <main className='mx-auto flex min-h-[70vh] max-w-xl flex-col items-center justify-center gap-6 px-4 pt-24 text-center'>
      <p className='text-sm font-medium tracking-widest text-primary uppercase'>
        404
      </p>
      <h1 className='text-3xl font-bold text-text'>
        That page is not on the menu
      </h1>
      <p className='text-text-muted'>
        The link may be old, or the recipe may have moved. Head back and find
        something good to cook.
      </p>
      <Button href='/'>Browse recipes</Button>
    </main>
  </LandingPageTemplate>
)

export default NotFound
