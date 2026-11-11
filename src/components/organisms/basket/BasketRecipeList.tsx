'use client'

import type { ReactElement } from 'react'

import Link from 'next/link'

import type { BasketEntry, RecipeShare } from '@/libs/basket'

import { ServingsStepper } from '@/components/molecules/recipe'
import { formatMoney } from '@/libs/basket'
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

// The recipes in this trip, each with how many servings to cook and a remove button. The cost
// per serving follows the stepper, so filling packs you are already buying shows as a saving.
export const BasketRecipeList = ({
  entries,
  recipes,
  shares,
}: BasketRecipeListProps): ReactElement => {
  const { setServings, remove } = useBasket()

  return (
    <ul className='divide-y divide-text-muted/15 rounded-xl bg-surface'>
      {entries.map(({ slug, build, servings }) => {
        const { title } = recipeInfo(recipes, slug, build)
        const share = shares.get(slug)
        // Bundling or cooking more moved the price off the recipe as written
        const compares =
          share &&
          Math.abs(share.togetherPerServing - share.writtenPerServing) >= 0.01

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
                {share && (
                  <>
                    <span className='font-semibold text-text'>
                      {formatMoney(share.togetherPerServing)}
                    </span>
                    /serving
                    {compares &&
                      ` (vs ${formatMoney(share.writtenPerServing)} as written)`}
                  </>
                )}
              </p>
            </div>
            <div className='flex items-center gap-4 text-sm'>
              <ServingsStepper
                servings={servings}
                onChange={(next) => setServings(slug, next)}
                recipe={title}
              />
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
