'use client'

import type { ReactNode } from 'react'

import { useCallback, useEffect, useMemo, useState } from 'react'

import type { StoredBasket } from '@/libs/basket'

import {
  BASKET_SLUGS,
  BASKET_STORAGE_KEY,
  EMPTY_BASKET,
  parseStoredBasket,
  setBatches as withBatches,
} from '@/libs/basket'

import type { BasketContextValue } from './BasketContext'

import { BasketContext } from './BasketContext'

type BasketProviderProps = {
  children: ReactNode
}

const readStored = (): StoredBasket => {
  try {
    return parseStoredBasket(localStorage.getItem(BASKET_STORAGE_KEY))
  } catch {
    // Storage can be blocked (private mode, site data off). The basket still works for the visit.
    return EMPTY_BASKET
  }
}

const writeStored = (basket: StoredBasket): void => {
  try {
    localStorage.setItem(BASKET_STORAGE_KEY, JSON.stringify(basket))
  } catch {
    // Same as above: keep going without saving
  }
}

// The basket lives in this browser. Saving it to the account comes with PRD 08's account step.
export const BasketProvider = ({
  children,
}: BasketProviderProps): ReactNode => {
  const [basket, setBasket] = useState<StoredBasket>(EMPTY_BASKET)
  const [isLoaded, setIsLoaded] = useState(false)

  // Read after mount so the server render and the first client render match
  useEffect(() => {
    setBasket(readStored())
    setIsLoaded(true)

    // Keep tabs in step: a change in one tab shows up in the others
    const onStorage = (event: StorageEvent): void => {
      if (event.key === BASKET_STORAGE_KEY)
        setBasket(parseStoredBasket(event.newValue))
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const update = useCallback(
    (change: (current: StoredBasket) => StoredBasket): void => {
      setBasket((current) => {
        const next = change(current)
        writeStored(next)
        return next
      })
    },
    []
  )

  const value = useMemo<BasketContextValue>(() => {
    const slugs = new Set(basket.entries.map(({ slug }) => slug))

    return {
      entries: basket.entries,
      includePantry: basket.includePantry,
      checked: new Set(basket.checked),
      isLoaded,
      has: (slug) => slugs.has(slug),
      add: (slug) => {
        if (!BASKET_SLUGS.has(slug)) return
        update((current) =>
          current.entries.some((entry) => entry.slug === slug)
            ? current
            : {
                ...current,
                entries: [...current.entries, { slug, batches: 1 }],
              }
        )
      },
      remove: (slug) =>
        update((current) => ({
          ...current,
          entries: current.entries.filter((entry) => entry.slug !== slug),
        })),
      setBatches: (slug, batches) =>
        update((current) => ({
          ...current,
          entries: withBatches(current.entries, slug, batches),
        })),
      setIncludePantry: (include) =>
        update((current) => ({ ...current, includePantry: include })),
      toggleChecked: (key) =>
        update((current) => ({
          ...current,
          checked: current.checked.includes(key)
            ? current.checked.filter((item) => item !== key)
            : [...current.checked, key],
        })),
      clear: () => update(() => EMPTY_BASKET),
    }
  }, [basket, isLoaded, update])

  return <BasketContext value={value}>{children}</BasketContext>
}
