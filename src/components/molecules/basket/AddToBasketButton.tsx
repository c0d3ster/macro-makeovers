'use client'

import type { ReactElement } from 'react'

import Link from 'next/link'

import { BASKET_SLUGS } from '@/libs/basket'
import { useBasket } from '@/providers'

import { BasketIcon } from './BasketIcon'

type AddToBasketButtonProps = {
  slug: string
  title: string
  // The build to add. Missing means the default build.
  build?: string
  // Servings to add, like the recipe page's stepper. Missing means the recipe's own.
  servings?: number
  // 'full' for the recipe page, 'compact' for the round button on a card photo
  variant?: 'full' | 'compact'
}

// Adds a recipe to the basket, or shows it is already there. Recipes without price data have
// no basket lines yet, so they show nothing.
export const AddToBasketButton = ({
  slug,
  title,
  build,
  servings,
  variant = 'full',
}: AddToBasketButtonProps): ReactElement | null => {
  const { has, servingsOf, add, remove, isLoaded } = useBasket()
  if (!BASKET_SLUGS.has(slug)) return null
  const inBasket = has(slug, build)
  // Another build of this recipe is in the basket, and adding this one swaps it
  const otherBuild = !inBasket && has(slug)

  if (variant === 'compact') {
    return (
      <button
        type='button'
        aria-pressed={inBasket}
        aria-label={
          inBasket
            ? `Remove ${title} from the basket`
            : `Add ${title} to the basket`
        }
        disabled={!isLoaded}
        onClick={() => (inBasket ? remove(slug) : add(slug, build))}
        className={`flex size-10 cursor-pointer items-center justify-center rounded-full shadow-md transition-colors focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none disabled:opacity-0 ${
          inBasket
            ? 'bg-primary text-on-primary'
            : 'bg-surface/90 text-text hover:bg-surface'
        }`}
      >
        {inBasket ? (
          <svg
            aria-hidden='true'
            viewBox='0 0 16 16'
            className='size-4'
            fill='none'
            stroke='currentColor'
            strokeWidth='2'
            strokeLinecap='round'
            strokeLinejoin='round'
          >
            <path d='M3 8.5l3.5 3.5L13 5' />
          </svg>
        ) : (
          <BasketIcon />
        )}
      </button>
    )
  }

  if (inBasket) {
    const inBasketServings = servingsOf(slug)
    // The page's stepper moved off what the basket holds, so offer to match it
    const canUpdate =
      servings !== undefined &&
      inBasketServings !== undefined &&
      servings !== inBasketServings

    return (
      <div className='flex flex-wrap items-center justify-between gap-2 rounded-xl border border-primary/40 px-4 py-3 text-sm'>
        <span className='flex items-center gap-2 font-medium text-text'>
          <BasketIcon />
          In your basket
          {inBasketServings !== undefined && (
            <span className='font-normal text-text-muted'>
              ({inBasketServings} servings)
            </span>
          )}
        </span>
        <span className='flex gap-3'>
          {canUpdate && (
            <button
              type='button'
              onClick={() => add(slug, build, servings)}
              className='cursor-pointer text-primary underline hover:no-underline'
            >
              Change to {servings}
            </button>
          )}
          <Link href='/basket' className='text-primary underline'>
            View basket
          </Link>
          <button
            type='button'
            onClick={() => remove(slug)}
            className='cursor-pointer text-text-muted underline hover:text-text'
          >
            Remove
          </button>
        </span>
      </div>
    )
  }

  return (
    <button
      type='button'
      disabled={!isLoaded}
      onClick={() => add(slug, build, servings)}
      className='flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-medium text-on-primary transition-colors hover:bg-primary/90 focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:outline-none disabled:opacity-50'
    >
      <BasketIcon />
      {otherBuild ? 'Swap this build into the basket' : 'Add to basket'}
    </button>
  )
}
