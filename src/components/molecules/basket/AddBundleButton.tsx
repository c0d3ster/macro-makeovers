'use client'

import type { ReactElement } from 'react'

import Link from 'next/link'

import { track } from '@/libs/analytics'
import { useBasket } from '@/providers'

type AddBundleButtonProps = {
  // Each recipe at the servings it is written for
  recipes: { slug: string; servings: number }[]
}

// Adds every recipe in a bundle to the basket, then links to it
export const AddBundleButton = ({
  recipes,
}: AddBundleButtonProps): ReactElement => {
  const { hasRecipe, add, isLoaded } = useBasket()
  const slugs = recipes.map(({ slug }) => slug)
  const allIn = slugs.every((slug) => hasRecipe(slug))

  if (allIn) {
    return (
      <Link
        href='/basket'
        className='text-sm font-medium text-primary underline hover:text-text'
      >
        In your basket. View it
      </Link>
    )
  }

  return (
    <button
      type='button'
      disabled={!isLoaded}
      onClick={() => {
        recipes.forEach(({ slug, servings }) => add(slug, undefined, servings))
        track('bundle_add', { slugs: slugs.join(',') })
      }}
      className='cursor-pointer rounded-md border border-primary px-3 py-1.5 text-sm font-medium text-primary transition-colors hover:bg-primary hover:text-on-primary disabled:opacity-50'
    >
      Add both to basket
    </button>
  )
}
