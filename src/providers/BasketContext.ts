'use client'

import { createContext, use } from 'react'

import type { BasketEntry } from '@/libs/basket'

export type BasketContextValue = {
  entries: BasketEntry[]
  includePantry: boolean
  checked: Set<string>
  // False until the saved basket is read, so counts don't flash 0 then jump
  isLoaded: boolean
  // True only when this build is the one in the basket. Missing means the default build.
  has: (slug: string, build?: string) => boolean
  // True when any build of the recipe is in the basket
  hasRecipe: (slug: string) => boolean
  // The servings in the basket for a recipe, if it is there
  servingsOf: (slug: string) => number | undefined
  // Builds of one recipe are mutually exclusive, so adding another build replaces it. Servings
  // default to the recipe's own.
  add: (slug: string, build?: string, servings?: number) => void
  remove: (slug: string) => void
  setServings: (slug: string, servings: number) => void
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
  hasRecipe: () => false,
  servingsOf: () => undefined,
  add: noop,
  remove: noop,
  setServings: noop,
  setIncludePantry: noop,
  toggleChecked: noop,
  clear: noop,
})

export const useBasket = (): BasketContextValue => use(BasketContext)
