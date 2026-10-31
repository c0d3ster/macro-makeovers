import type { Metadata } from 'next'
import type { ReactElement } from 'react'

import { ContactForm } from '@/components/molecules'
import { FilterBar, RecipeGrid } from '@/components/organisms'
import { LandingPageTemplate } from '@/components/templates'
import { Env } from '@/libs/Env'
import { parseRecipeFilters } from '@/libs/recipes'

import { loadRecipeBrowse } from './loadRecipeBrowse'

const TAGLINE = 'High-protein, lower-fat versions of foods people love'

export const metadata: Metadata = {
  title: { absolute: `${Env.NEXT_PUBLIC_BRAND_NAME}: ${TAGLINE}` },
  description: `${TAGLINE}. Comfort-food staples rebuilt to keep the flavor while cutting the fat and adding protein.`,
}

type HomePageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

// Filter state lives in the URL, so the page renders per request and every view is a link
const HomePage = async ({
  searchParams,
}: HomePageProps): Promise<ReactElement> => {
  const filters = parseRecipeFilters(await searchParams)
  const browse = await loadRecipeBrowse(filters)
  const intro = (
    <header className='max-w-2xl'>
      <h1 className='mb-3 text-3xl font-bold text-text sm:text-4xl'>
        {Env.NEXT_PUBLIC_BRAND_NAME}
      </h1>
      <p className='text-base text-text-muted sm:text-lg'>
        {TAGLINE}. Comfort-food staples rebuilt to keep the flavor while cutting
        the fat and adding protein.
      </p>
    </header>
  )

  return (
    <LandingPageTemplate>
      <main className='mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8'>
        {browse ? (
          <>
            <FilterBar
              filters={filters}
              tagGroups={browse.tagGroups}
              unavailable={browse.unavailable}
              intro={intro}
            />
            <RecipeGrid
              recipes={browse.visible}
              isFiltered={browse.all.length > 0}
            />
          </>
        ) : (
          <>
            <div className='mb-8'>{intro}</div>
            <p className='rounded-xl bg-surface p-8 text-center text-text-muted'>
              Recipes are unavailable right now. Please try again in a minute.
            </p>
          </>
        )}
      </main>

      <div id='contact' className='bg-surface py-16'>
        <ContactForm />
      </div>
    </LandingPageTemplate>
  )
}

export default HomePage
