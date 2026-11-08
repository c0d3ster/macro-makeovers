import type { ReactElement } from 'react'

import type { BasketTotals } from '@/libs/basket'

import { formatMoney } from '@/libs/basket'

type BasketSummaryProps = {
  totals: BasketTotals
  perServing: number
  saving: number
  // Short-shelf-life items with the most left over, for the waste note
  perishableNames: string[]
}

// Below this, the leftover note is noise
const WASTE_NOTE_MIN = 1

// One line: what the trip costs at the store, what that works out to per serving (prorated,
// the same way recipe pages price it), and what buying together saves
export const BasketSummary = ({
  totals,
  perServing,
  saving,
  perishableNames,
}: BasketSummaryProps): ReactElement => (
  <div className='rounded-xl border border-text-muted/20 p-4'>
    <p className='flex flex-wrap items-baseline gap-x-5 gap-y-2 text-text-muted'>
      <span>
        <span className='text-2xl font-semibold text-text'>
          {formatMoney(totals.tripCost)}
        </span>{' '}
        at the store
      </span>
      <span>
        <span className='text-lg font-semibold text-text'>
          {formatMoney(perServing)}
        </span>{' '}
        per serving
      </span>
      {saving >= 0.01 && (
        <span>
          saves{' '}
          <span className='font-semibold text-text'>{formatMoney(saving)}</span>{' '}
          vs buying separately
        </span>
      )}
    </p>
    {totals.perishableLeftoverCost >= WASTE_NOTE_MIN && (
      <p className='mt-2 text-sm text-text-muted'>
        About {formatMoney(totals.perishableLeftoverCost)} of{' '}
        {perishableNames.join(', ').toLowerCase()} may go unused before it
        spoils.
      </p>
    )}
  </div>
)
