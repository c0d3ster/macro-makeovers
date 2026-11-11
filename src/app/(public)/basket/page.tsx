import type { Metadata } from 'next'
import type { ReactElement } from 'react'

import type { BasketRecipeLookup } from '@/components/organisms'

import { basketRecipeKey, BasketView } from '@/components/organisms'
import { LandingPageTemplate } from '@/components/templates'
import { BASKET_SLUGS } from '@/libs/basket'
import { logger } from '@/libs/Logger'
import { services } from '@/services'

export const metadata: Metadata = {
  title: 'Your basket',
  description:
    'Pick recipes to cook this week and get one pooled shopping list with the trip cost.',
  // Each visitor's basket is their own, so there is nothing here for search
  robots: { index: false },
}

// Titles and photos for the recipes that have basket data. The basket still works without
// them, showing names made from the slugs.
const loadBasketRecipes = async (): Promise<BasketRecipeLookup> => {
  try {
    const cards = await services.recipeService.getRecipeCards()
    return Object.fromEntries(
      cards
        .filter(({ slug }) => BASKET_SLUGS.has(slug))
        .flatMap(({ slug, title, imageUrl, builds }) => [
          [slug, { title, imageUrl }],
          ...builds
            .filter(({ isDefault }) => !isDefault)
            .map((build) => [
              basketRecipeKey(slug, build.key),
              { title: build.title, imageUrl: build.imageUrl },
            ]),
        ])
    )
  } catch (error) {
    logger.error('Could not load recipes for the basket', { error })
    return {}
  }
}

const BasketPage = async (): Promise<ReactElement> => {
  const recipes = await loadBasketRecipes()

  return (
    <LandingPageTemplate activeItem='basket'>
      <main className='mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8'>
        <h1 className='mb-2 text-3xl font-bold text-text sm:text-4xl'>
          Your basket
        </h1>
        <p className='mb-8 text-text-muted'>
          Cook a few recipes in the same stretch and buy for them in one trip.
          Shared ingredients pool, packs round up once, and the list follows the
          store. Totals are estimated subtotals: your store&apos;s prices will
          differ, and state and local sales tax is added on top at checkout.
        </p>
        <BasketView recipes={recipes} />
      </main>
    </LandingPageTemplate>
  )
}

export default BasketPage
