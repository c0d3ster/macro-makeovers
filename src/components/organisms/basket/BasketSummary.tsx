import type { ReactElement } from 'react'

import type { BasketTotals, BundleComparison } from '@/libs/basket'

import { formatMoney } from '@/libs/basket'

type BasketSummaryProps = {
  totals: BasketTotals
  perServing: number
  saving: number
  // Alone against together, shown once the basket has two or more recipes
  comparison?: BundleComparison
  // Short-shelf-life items with the most left over, for the waste note
  perishableNames: string[]
}

// Below this, the leftover note is noise
const WASTE_NOTE_MIN = 1

// One line: what the trip costs at the store before tax, what that works out to per serving (prorated,
// the same way recipe pages price it), and what buying together saves
export const BasketSummary = ({
  totals,
  perServing,
  saving,
  comparison,
  perishableNames,
}: BasketSummaryProps): ReactElement => (
  <div className='rounded-xl border border-text-muted/20 p-4'>
    <p className='flex flex-wrap items-baseline gap-x-5 gap-y-2 text-text-muted'>
      <span>
        <span className='text-2xl font-semibold text-text'>
          {formatMoney(totals.tripCost)}
        </span>{' '}
        before tax
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
    {comparison && saving >= 0.01 && (
      <p className='mt-2 text-sm text-text-muted'>
        At the register that is{' '}
        <span className='font-semibold text-text'>
          {formatMoney(comparison.togetherPerServing)}
        </span>{' '}
        a serving together, against{' '}
        {formatMoney(comparison.alonePerServing)} buying each recipe on its own
        trip. About{' '}
        <span className='font-semibold text-text'>
          {formatMoney(comparison.leftoverTogether)}
        </span>{' '}
        is left over for later, instead of{' '}
        {formatMoney(comparison.leftoverAlone)}.
      </p>
    )}
    {totals.perishableLeftoverCost >= WASTE_NOTE_MIN && (
      <p className='mt-2 text-sm text-text-muted'>
        About {formatMoney(totals.perishableLeftoverCost)} of{' '}
        {perishableNames.join(', ').toLowerCase()} may go unused before it
        spoils.
      </p>
    )}
  </div>
)
