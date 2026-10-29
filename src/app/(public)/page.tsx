import type { Metadata } from 'next'
import type { ReactElement } from 'react'

import { ContactForm } from '@/components/molecules'
import { RecipeGrid } from '@/components/organisms'
import { LandingPageTemplate } from '@/components/templates'
import { Env } from '@/libs/Env'
import { logger } from '@/libs/Logger'
import { listRecipeCards } from '@/libs/recipes'
import { createPublicClient } from '@/libs/supabase/public'

const TAGLINE = 'High-protein, lower-fat versions of foods people love'

// Public data, so the page is cached and refreshed at most once a minute
export const revalidate = 60

export const metadata: Metadata = {
  title: { absolute: `${Env.NEXT_PUBLIC_BRAND_NAME}: ${TAGLINE}` },
  description: `${TAGLINE}. Comfort-food staples rebuilt to keep the flavor while cutting the fat and adding protein.`,
}

const loadRecipes = async () => {
  try {
    return await listRecipeCards(createPublicClient())
  } catch (error) {
    // Keep the page up with an empty state instead of failing the whole site
    logger.error('Could not load recipes for the home page', { error })
    return undefined
  }
}

const HomePage = async (): Promise<ReactElement> => {
  const recipes = await loadRecipes()

  return (
    <LandingPageTemplate>
      <main className='mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8'>
        <header className='mb-10 max-w-2xl'>
          <h1 className='mb-3 text-4xl font-bold text-text'>
            {Env.NEXT_PUBLIC_BRAND_NAME}
          </h1>
          <p className='text-lg text-text-muted'>
            {TAGLINE}. Comfort-food staples rebuilt to keep the flavor while
            cutting the fat and adding protein.
          </p>
        </header>

        {recipes ? (
          <RecipeGrid recipes={recipes} />
        ) : (
          <p className='rounded-xl bg-surface p-8 text-center text-text-muted'>
            Recipes are unavailable right now. Please try again in a minute.
          </p>
        )}
      </main>

      <div id='contact' className='bg-surface py-16'>
        <ContactForm />
      </div>
    </LandingPageTemplate>
  )
}

export default HomePage
