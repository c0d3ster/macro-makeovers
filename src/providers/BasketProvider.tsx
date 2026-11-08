'use client'

import type { ReactNode } from 'react'

import { useMemo, useState, useSyncExternalStore } from 'react'

import {
  BASKET_SLUGS,
  EMPTY_BASKET,
  setBatches as withBatches,
} from '@/libs/basket'

import type { BasketContextValue } from './BasketContext'

import { BasketContext } from './BasketContext'
import { BasketStore } from './BasketStore'

type BasketProviderProps = {
  children: ReactNode
}

const noopSubscribe = (): (() => void) => () => {}

// The basket lives in this browser. Saving it to the account comes with PRD 08's account step.
export const BasketProvider = ({
  children,
}: BasketProviderProps): ReactNode => {
  const [store] = useState(() => new BasketStore())
  const basket = useSyncExternalStore(
    store.subscribe,
    store.getSnapshot,
    store.getServerSnapshot
  )
  // False on the server and while hydrating, so counts don't flash 0 then jump
  const isLoaded = useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false
  )

  const value = useMemo<BasketContextValue>(() => {
    const { update } = store
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
  }, [basket, isLoaded, store])

  return <BasketContext value={value}>{children}</BasketContext>
}
