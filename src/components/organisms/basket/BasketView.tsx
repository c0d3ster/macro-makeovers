'use client'

import type { ReactElement } from 'react'

import Link from 'next/link'
import { useEffect } from 'react'

import type { BasketCatalog } from '@/libs/basket'

import {
  compareToWritten,
  computeBasket,
  findBasketRecipe,
  formatMoney,
  hasBasketRecipe,
  recipeShares,
  suggestAddition,
} from '@/libs/basket'
import { useBasket } from '@/providers'

import type { BasketRecipeLookup } from './basketRecipes'

import { BasketRecipeList } from './BasketRecipeList'
import { recipeInfo } from './basketRecipes'
import { BasketSummary } from './BasketSummary'
import { SendToCart } from './SendToCart'
import { ShoppingList } from './ShoppingList'

type BasketViewProps = {
  // The price book and every published recipe's lines
  catalog: BasketCatalog
  recipes: BasketRecipeLookup
}

// How many short-shelf-life items the waste note names
const PERISHABLE_NAMES = 3

const formatDate = (isoDate: string): string =>
  new Date(`${isoDate}T12:00:00Z`).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })

// "November 11, 2026", or "November 11 to 16, 2026" when the prices span several days
const formatPriceDates = ({ pricedFrom, pricedThrough }: BasketCatalog): string => {
  if (!pricedFrom || !pricedThrough || pricedFrom === pricedThrough) {
    return pricedThrough ? formatDate(pricedThrough) : 'the snapshot date'
  }
  return `${formatDate(pricedFrom)} to ${formatDate(pricedThrough)}`
}

export const BasketView = ({ catalog, recipes }: BasketViewProps): ReactElement => {
  const { entries: saved, includePantry, isLoaded, add, remove, clear } = useBasket()
  // A recipe that lost its basket data or was unpublished drops out, the same as an old
  // basket did on read. An empty catalog (one that failed to load) drops nothing.
  const canPrune = catalog.recipes.length > 0
  const entries = canPrune
    ? saved.filter(({ slug }) => hasBasketRecipe(catalog, slug))
    : saved
  const gone = canPrune
    ? saved.filter(({ slug }) => !hasBasketRecipe(catalog, slug)).map(({ slug }) => slug)
    : []
  const goneKey = gone.join(',')

  useEffect(() => {
    if (goneKey) goneKey.split(',').forEach(remove)
  }, [goneKey, remove])

  if (!isLoaded) {
    return <p className='text-text-muted'>Loading your basket…</p>
  }

  if (entries.length === 0) {
    return (
      <div className='rounded-xl bg-surface p-8 text-center'>
        <p className='mb-2 text-lg font-medium text-text'>
          Your basket is empty
        </p>
        <p className='mb-6 text-text-muted'>
          Add recipes you plan to cook this week. Their ingredients pool into
          one list, and buying them together costs less than buying each one
          alone.
        </p>
        <Link
          href='/recipes'
          className='inline-block rounded bg-primary px-6 py-3 font-medium text-on-primary hover:bg-primary/90'
        >
          Browse recipes
        </Link>
      </div>
    )
  }

  const options = { includePantry }
  const totals = computeBasket(catalog, entries, options)
  const suggestion = suggestAddition(catalog, entries, options)
  const perishableNames = totals.lines
    .filter(
      ({ item, leftoverQuantity }) => item.perishable && leftoverQuantity > 0
    )
    .sort((a, b) => b.cost - b.proratedCost - (a.cost - a.proratedCost))
    .slice(0, PERISHABLE_NAMES)
    .map(
      ({ item }) =>
        item.name.replace(/\s*\(.*\)/, '').split(',')[0] ?? item.name
    )

  return (
    <div className='flex flex-col gap-8'>
      <section aria-labelledby='basket-recipes' className='flex flex-col gap-3'>
        <div className='flex items-center justify-between'>
          <h2 id='basket-recipes' className='text-xl font-bold text-text'>
            Recipes in this trip
          </h2>
          <button
            type='button'
            onClick={clear}
            className='cursor-pointer text-sm text-text-muted underline hover:text-text'
          >
            Clear basket
          </button>
        </div>
        <BasketRecipeList
          entries={entries}
          recipes={recipes}
          shares={recipeShares(catalog, entries, options)}
        />
        <BasketSummary
          totals={totals}
          comparison={compareToWritten(catalog, entries, options)}
          perishableNames={perishableNames}
        />
        {suggestion && (
          <div className='flex flex-wrap items-center justify-between gap-3 rounded-xl border border-dashed border-primary/50 px-4 py-3'>
            <p className='text-text-muted'>
              Add{' '}
              <Link
                href={`/recipes/${suggestion.slug}`}
                className='font-medium text-text hover:text-primary'
              >
                {recipeInfo(recipes, suggestion.slug).title}
              </Link>{' '}
              and save another{' '}
              <span className='font-semibold text-text'>
                {formatMoney(suggestion.saving)}
              </span>
            </p>
            <button
              type='button'
              onClick={() =>
                add(
                  suggestion.slug,
                  undefined,
                  findBasketRecipe(catalog, suggestion.slug)?.servings ?? 1
                )
              }
              className='cursor-pointer rounded-md border border-primary px-3 py-1.5 text-sm font-medium text-primary hover:bg-primary hover:text-on-primary'
            >
              Add it
            </button>
          </div>
        )}
      </section>

      <ShoppingList lines={totals.lines} recipes={recipes} />

      <SendToCart />

      <p className='text-sm text-text-muted'>
        Costs are estimates from the lowest prices found at national chains and
        Martin&apos;s on {formatPriceDates(catalog)}. The total buys whole packs,
        and each recipe&apos;s cost per serving here is its share of those
        packs. Recipe pages count only what a recipe uses, so they read lower.
      </p>
    </div>
  )
}
