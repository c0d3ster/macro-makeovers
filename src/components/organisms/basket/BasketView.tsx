'use client'

import type { ReactElement } from 'react'

import Link from 'next/link'

import {
  bundleSavings,
  computeBasket,
  costPerServing,
  formatMoney,
  PRICES_AS_OF,
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

export const BasketView = ({ recipes }: BasketViewProps): ReactElement => {
  const { entries, includePantry, isLoaded, add, clear } = useBasket()

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
  const totals = computeBasket(entries, options)
  const saving = bundleSavings(entries, options)
  const suggestion = suggestAddition(entries, options)
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
        <BasketRecipeList entries={entries} recipes={recipes} />
        <BasketSummary
          totals={totals}
          perServing={costPerServing(entries)}
          saving={saving}
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
              onClick={() => add(suggestion.slug)}
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
        Costs are estimates from the lowest prices found across several stores
        on {formatDate(PRICES_AS_OF)}. The store total buys whole packs, and the
        per-serving cost counts only what the recipes use, the same way each
        recipe page prices it.
      </p>
    </div>
  )
}
