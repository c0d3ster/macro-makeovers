import type { BasketEntry } from './basketTypes'

import { BASKET_SLUGS, findBasketRecipe } from './basketMath'

// The basket as the browser keeps it between visits
export type StoredBasket = {
  entries: BasketEntry[]
  includePantry: boolean
  // Item keys ticked off while shopping
  checked: string[]
}

export const BASKET_STORAGE_KEY = 'macro-makeovers-basket-v1'
// Same range as the recipe page's servings stepper
export const MIN_SERVINGS = 1
export const MAX_SERVINGS = 24

export const EMPTY_BASKET: StoredBasket = {
  entries: [],
  includePantry: false,
  checked: [],
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const clampServings = (value: number): number =>
  Math.min(MAX_SERVINGS, Math.max(MIN_SERVINGS, Math.round(value)))

// Keeps entries for recipes that still have basket data, one per slug, with sane servings
const toEntries = (value: unknown): BasketEntry[] => {
  if (!Array.isArray(value)) return []
  const seen = new Set<string>()
  return value.flatMap((entry: unknown): BasketEntry[] => {
    if (!isRecord(entry)) return []
    const { slug, build, servings } = entry
    if (typeof slug !== 'string' || !BASKET_SLUGS.has(slug) || seen.has(slug))
      return []
    seen.add(slug)
    return [
      {
        slug,
        ...(typeof build === 'string' && build ? { build } : {}),
        servings:
          typeof servings === 'number'
            ? clampServings(servings)
            : (findBasketRecipe(slug)?.servings ?? MIN_SERVINGS),
      },
    ]
  })
}

// Browser storage is untrusted: an old version, a hand edit, or junk all fall back safely
export const parseStoredBasket = (raw: string | null): StoredBasket => {
  if (!raw) return EMPTY_BASKET
  let value: unknown
  try {
    value = JSON.parse(raw)
  } catch {
    return EMPTY_BASKET
  }
  if (!isRecord(value)) return EMPTY_BASKET

  return {
    entries: toEntries(value.entries),
    includePantry: value.includePantry === true,
    checked: Array.isArray(value.checked)
      ? value.checked.filter((key): key is string => typeof key === 'string')
      : [],
  }
}

export const setServings = (
  entries: BasketEntry[],
  slug: string,
  servings: number
): BasketEntry[] =>
  entries.map((entry) =>
    entry.slug === slug ? { ...entry, servings: clampServings(servings) } : entry
  )
