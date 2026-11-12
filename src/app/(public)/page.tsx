import type { Metadata } from 'next'
import type { ReactElement } from 'react'

import { permanentRedirect } from 'next/navigation'

import type { BundleLink } from '@/components/organisms'
import type { RecipeCard } from '@/libs/recipes'

import {
  BundleLinks,
  CompactRecipeGrid,
  GoalLinks,
  GuideLinks,
  HomeHero,
  HomeSection,
  RecipeGrid,
} from '@/components/organisms'
import { LandingPageTemplate } from '@/components/templates'
import { pickDistinctBundles, rankBundles } from '@/libs/basket'
import { Env } from '@/libs/Env'
import { logger } from '@/libs/Logger'
import {
  cardsForCourses,
  DISH_COURSES,
  parseRecipeFilters,
  pickFeaturedRecipes,
  SIDE_COURSES,
  toSearchParams,
} from '@/libs/recipes'
import { services } from '@/services'

const TAGLINE = 'High-protein, lower-fat versions of foods people love'
const FEATURED_COUNT = 3
const BUNDLE_COUNT = 3

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
  {
    href: '/about',
    title: 'Why this exists',
    blurb: 'Comfort food that keeps its flavor and still fits your macros.',
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

// The pairs of published recipes that save the most bought together, none sharing a recipe
const toBundles = (recipes: RecipeCard[]): BundleLink[] => {
  const titles = new Map(recipes.map(({ slug, title }) => [slug, title]))
  return pickDistinctBundles(
    rankBundles([...titles.keys()], 2, { includePantry: false }),
    BUNDLE_COUNT
  ).map(({ slugs, saving, comparison }) => ({
    saving,
    comparison,
    recipes: slugs.map((slug) => ({ slug, title: titles.get(slug) ?? slug })),
  }))
}

const HomePage = async ({
  searchParams,
}: HomePageProps): Promise<ReactElement> => {
  // The browser moved to /recipes. Old shared links like /?goal=fat-loss keep working.
  const query = toSearchParams(
    parseRecipeFilters(await searchParams)
  ).toString()
  if (query) permanentRedirect(`/recipes?${query}`)

  const cards = await loadRecipeCards()
  const recipes = cards && cardsForCourses(cards, DISH_COURSES)
  const sides = cards ? cardsForCourses(cards, SIDE_COURSES) : []
  const featured = recipes && pickFeaturedRecipes(recipes, FEATURED_COUNT)
  const bundles = recipes ? toBundles(recipes) : []

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

        {sides.length > 0 && (
          <HomeSection
            title='Sides and sauces'
            intro='The salsas and sides the dishes use, each with its own macros.'
            more={{ href: '/recipes', label: 'All recipes' }}
          >
            <CompactRecipeGrid recipes={sides} />
          </HomeSection>
        )}

        {bundles.length > 0 && (
          <HomeSection
            title='Cook these together'
            intro='Recipes that share ingredients cost less bought in one trip, since the packs round up once.'
            more={{ href: '/basket', label: 'Your basket' }}
          >
            <BundleLinks bundles={bundles} />
          </HomeSection>
        )}

        <HomeSection
          title='Pick your goal'
          intro='Each goal ranks every recipe by how close it lands, and marks the good fits.'
        >
          <GoalLinks />
        </HomeSection>

        <HomeSection title='Guides and background'>
          <GuideLinks guides={GUIDES} />
        </HomeSection>
      </main>
    </LandingPageTemplate>
  )
}

export default HomePage
