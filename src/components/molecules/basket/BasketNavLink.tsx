'use client'

import type { ReactElement } from 'react'

import Link from 'next/link'

import { useBasket } from '@/providers'

import { BasketIcon } from './BasketIcon'

// The header's basket icon, with how many recipes are in it
export const BasketNavLink = (): ReactElement => {
  const { entries, isLoaded } = useBasket()
  const count = isLoaded ? entries.length : 0
  const label =
    count === 0
      ? 'Basket, empty'
      : `Basket, ${count} ${count === 1 ? 'recipe' : 'recipes'}`

  return (
    <Link
      href='/basket'
      aria-label={label}
      className='relative flex size-9 items-center justify-center rounded-full text-header-muted transition-colors hover:text-header-text focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none'
    >
      <BasketIcon className='size-6' />
      {count > 0 && (
        <span
          aria-hidden='true'
          className='absolute -top-0.5 -right-0.5 flex min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] leading-4 font-semibold text-on-primary'
        >
          {count}
        </span>
      )}
    </Link>
  )
}
