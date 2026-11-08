import type { BasketEntry } from './basketTypes'

import { BASKET_SLUGS } from './basketMath'

// The basket as the browser keeps it between visits
export type StoredBasket = {
  entries: BasketEntry[]
  includePantry: boolean
  // Item keys ticked off while shopping
  checked: string[]
}

export const BASKET_STORAGE_KEY = 'macro-makeovers-basket-v1'
export const MAX_BATCHES = 3

export const EMPTY_BASKET: StoredBasket = {
  entries: [],
  includePantry: false,
  checked: [],
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const clampBatches = (value: number): number =>
  Math.min(MAX_BATCHES, Math.max(1, Math.round(value)))

// Keeps entries for recipes that still have basket data, one per slug, with sane batch counts
const toEntries = (value: unknown): BasketEntry[] => {
  if (!Array.isArray(value)) return []
  const seen = new Set<string>()
  return value.flatMap((entry: unknown): BasketEntry[] => {
    if (!isRecord(entry)) return []
    const { slug, batches } = entry
    if (typeof slug !== 'string' || !BASKET_SLUGS.has(slug) || seen.has(slug))
      return []
    seen.add(slug)
    return [
      {
        slug,
        batches: typeof batches === 'number' ? clampBatches(batches) : 1,
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

export const setBatches = (
  entries: BasketEntry[],
  slug: string,
  batches: number
): BasketEntry[] =>
  entries.map((entry) =>
    entry.slug === slug ? { slug, batches: clampBatches(batches) } : entry
  )
