'use client'

import type { ReactElement } from 'react'

import Link from 'next/link'

import type { BasketEntry, RecipeShare } from '@/libs/basket'

import { findBasketRecipe, formatMoney, MAX_BATCHES } from '@/libs/basket'
import { buildHref } from '@/libs/recipes/recipeBuilds'
import { useBasket } from '@/providers'

import type { BasketRecipeLookup } from './basketRecipes'

import { recipeInfo } from './basketRecipes'

type BasketRecipeListProps = {
  entries: BasketEntry[]
  recipes: BasketRecipeLookup
  // Each recipe's checkout cost per serving in this trip, and alone
  shares: Map<string, RecipeShare>
}

const BATCH_OPTIONS = Array.from(
  { length: MAX_BATCHES },
  (_, index) => index + 1
)

// The recipes in this trip, each with how many batches to cook and a remove button
export const BasketRecipeList = ({
  entries,
  recipes,
  shares,
}: BasketRecipeListProps): ReactElement => {
  const { setBatches, remove } = useBasket()

  return (
    <ul className='divide-y divide-text-muted/15 rounded-xl bg-surface'>
      {entries.map(({ slug, build, batches }) => {
        const { title } = recipeInfo(recipes, slug, build)
        const servings = (findBasketRecipe(slug)?.servings ?? 0) * batches
        const selectId = `batches-${slug}`
        const share = shares.get(slug)
        // With one recipe there is nothing to compare against
        const compares = entries.length > 1 && share

        return (
          <li
            key={slug}
            className='flex flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-3'
          >
            <div className='min-w-0'>
              <Link
                href={buildHref(slug, build ? { key: build, isDefault: false } : undefined)}
                className='font-medium text-text hover:text-primary'
              >
                {title}
              </Link>
              <p className='text-sm text-text-muted'>
                {servings} servings
                {share && (
                  <>
                    {' · '}
                    <span className='font-semibold text-text'>
                      {formatMoney(share.togetherPerServing)}
                    </span>
                    /serving
                    {compares &&
                      ` (vs ${formatMoney(share.alonePerServing)} alone)`}
                  </>
                )}
              </p>
            </div>
            <div className='flex items-center gap-4 text-sm'>
              <label
                htmlFor={selectId}
                className='flex items-center gap-2 text-text-muted'
              >
                Batches
                <select
                  id={selectId}
                  value={batches}
                  onChange={(event) =>
                    setBatches(slug, Number(event.target.value))
                  }
                  className='rounded-md border border-text-muted/30 bg-background px-2 py-1 text-text'
                >
                  {BATCH_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>
              <button
                type='button'
                onClick={() => remove(slug)}
                aria-label={`Remove ${title}`}
                className='cursor-pointer text-text-muted underline hover:text-text'
              >
                Remove
              </button>
            </div>
          </li>
        )
      })}
    </ul>
  )
}
