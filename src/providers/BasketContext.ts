'use client'

import { createContext, use } from 'react'

import type { BasketEntry } from '@/libs/basket'

export type BasketContextValue = {
  entries: BasketEntry[]
  includePantry: boolean
  checked: Set<string>
  // False until the saved basket is read, so counts don't flash 0 then jump
  isLoaded: boolean
  has: (slug: string) => boolean
  add: (slug: string) => void
  remove: (slug: string) => void
  setBatches: (slug: string, batches: number) => void
  setIncludePantry: (include: boolean) => void
  toggleChecked: (key: string) => void
  clear: () => void
}

const noop = (): void => {}

// Default is an empty basket, so components render fine without a provider
export const BasketContext = createContext<BasketContextValue>({
  entries: [],
  includePantry: false,
  checked: new Set(),
  isLoaded: false,
  has: () => false,
  add: noop,
  remove: noop,
  setBatches: noop,
  setIncludePantry: noop,
  toggleChecked: noop,
  clear: noop,
})

export const useBasket = (): BasketContextValue => use(BasketContext)
