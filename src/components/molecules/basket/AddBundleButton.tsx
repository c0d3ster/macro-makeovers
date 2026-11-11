'use client'

import type { ReactElement } from 'react'

import Link from 'next/link'

import { useBasket } from '@/providers'

type AddBundleButtonProps = {
  slugs: string[]
}

// Adds every recipe in a bundle to the basket, then links to it
export const AddBundleButton = ({
  slugs,
}: AddBundleButtonProps): ReactElement => {
  const { hasRecipe, add, isLoaded } = useBasket()
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
      onClick={() => slugs.forEach((slug) => add(slug))}
      className='cursor-pointer rounded-md border border-primary px-3 py-1.5 text-sm font-medium text-primary transition-colors hover:bg-primary hover:text-on-primary disabled:opacity-50'
    >
      Add both to basket
    </button>
  )
}
