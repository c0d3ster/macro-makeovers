import type { BasketLine } from '@/libs/basket'

import { describePurchase } from '@/libs/basket'

import type { HandoffLine } from './groceryTypes'

import { measuresFor, searchTermFor } from './itemMappings'

// The basket's lines as a grocer should receive them: whole packs, checked-off items left out.
// Pantry staples are already in or out of `lines` by the pantry toggle (computeBasket).
export const toHandoffLines = (
  lines: BasketLine[],
  checked: ReadonlySet<string> = new Set()
): HandoffLine[] =>
  lines
    .filter(({ key }) => !checked.has(key))
    .map((line) => {
      const { key, item, packs, purchases, quantity } = line
      const byWeight = item.pack === 'per lb'
      const pounds = byWeight ? quantity / item.packQuantity : undefined
      // A grocer cart takes whole units, so 1.2 lb of chicken asks for 2
      const packCount =
        pounds !== undefined ? Math.max(1, Math.ceil(pounds - 1e-9)) : packs
      return {
        key,
        name: item.name,
        searchTerm: searchTermFor(key, item),
        packCount,
        ...(pounds !== undefined ? { pounds } : {}),
        measures: measuresFor(purchases, packCount, pounds),
        display: describePurchase(line),
      }
    })
