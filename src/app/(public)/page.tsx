import type { Metadata } from 'next'
import type { ReactElement } from 'react'

import { permanentRedirect } from 'next/navigation'

import type { RecipeCard } from '@/libs/recipes'

import {
  GoalLinks,
  GuideLinks,
  HomeHero,
  HomeSection,
  RecipeGrid,
} from '@/components/organisms'
import { LandingPageTemplate } from '@/components/templates'
import { Env } from '@/libs/Env'
import { logger } from '@/libs/Logger'
import {
  parseRecipeFilters,
  pickFeaturedRecipes,
  toSearchParams,
} from '@/libs/recipes'
import { services } from '@/services'

const TAGLINE = 'High-protein, lower-fat versions of foods people love'
const FEATURED_COUNT = 3

const GUIDES = [
  {
    href: '/guides/nutrition',
    title: 'Nutrition guide',
    blurb: 'Protein targets, the fat floor, and the ratio for each goal.',
  },
  {
    href: '/guides/shopping',
    title: 'Shopping guide',
    blurb: 'Lean proteins, the cottage cheese and yogurt swaps, and oils.',
  },
  {
    href: '/guides/reading-recipes',
    title: 'Reading a recipe',
    blurb: 'What cost, time, difficulty, and the nutrition table mean.',
  },
]

export const metadata: Metadata = {
  title: { absolute: `${Env.NEXT_PUBLIC_BRAND_NAME}: ${TAGLINE}` },
  description: `${TAGLINE}. Comfort-food staples rebuilt to keep the flavor while cutting the fat and adding protein.`,
}

type HomePageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

// An empty list keeps the rest of the home page up when recipes can't be loaded
const loadRecipeCards = async (): Promise<RecipeCard[] | undefined> => {
  try {
    return await services.recipeService.getRecipeCards()
  } catch (error) {
    logger.error('Could not load recipes for the home page', { error })
    return undefined
  }
}

const HomePage = async ({
  searchParams,
}: HomePageProps): Promise<ReactElement> => {
  // The browser moved to /recipes. Old shared links like /?goal=fat-loss keep working.
  const query = toSearchParams(
    parseRecipeFilters(await searchParams)
  ).toString()
  if (query) permanentRedirect(`/recipes?${query}`)

  const recipes = await loadRecipeCards()
  const featured = recipes && pickFeaturedRecipes(recipes, FEATURED_COUNT)

  return (
    <LandingPageTemplate activeItem='home'>
      <main className='mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8'>
        <HomeHero title={Env.NEXT_PUBLIC_BRAND_NAME} tagline={TAGLINE} />

        <HomeSection
          title='The biggest makeovers'
          intro='The dishes that cut the most fat per serving against the original.'
          more={{ href: '/recipes', label: 'All recipes' }}
        >
          {featured ? (
            <RecipeGrid recipes={featured} />
          ) : (
            <p className='rounded-xl bg-surface p-8 text-center text-text-muted'>
              Recipes are unavailable right now. Please try again in a minute.
            </p>
          )}
        </HomeSection>

        <HomeSection
          title='Pick your goal'
          intro='Each goal ranks every recipe by how close it lands, and marks the good fits.'
        >
          <GoalLinks />
        </HomeSection>

        <HomeSection title='Guides'>
          <GuideLinks guides={GUIDES} />
        </HomeSection>
      </main>
    </LandingPageTemplate>
  )
}

export default HomePage
