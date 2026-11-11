import type { ReactElement } from 'react'

import type { BasketTotals, BundleComparison } from '@/libs/basket'

import { formatMoney } from '@/libs/basket'

type BasketSummaryProps = {
  totals: BasketTotals
  saving: number
  // Together against separately, shown once the basket has two or more recipes
  comparison?: BundleComparison
  // Short-shelf-life items with the most left over, for the waste note
  perishableNames: string[]
}

// Below this, the leftover note is noise
const WASTE_NOTE_MIN = 1

// "a", "a and b", "a, b and c"
const listNames = (names: string[]): string =>
  names.length < 2
    ? (names[0] ?? '')
    : `${names.slice(0, -1).join(', ')} and ${names.at(-1)}`

type ComparisonRowProps = {
  label: string
  together: number
  separately: number
}

const ComparisonRow = ({
  label,
  together,
  separately,
}: ComparisonRowProps): ReactElement => (
  <tr>
    <th scope='row' className='py-1 pr-4 text-left font-normal'>
      {label}
    </th>
    <td className='py-1 pl-6 text-right font-semibold text-text'>
      {formatMoney(together)}
    </td>
    <td className='py-1 pl-6 text-right line-through decoration-text-muted/50'>
      {formatMoney(separately)}
    </td>
  </tr>
)

// The trip total first, since it is what people check. With two or more recipes, a small
// table sets the trip and its leftovers against buying each recipe on its own.
export const BasketSummary = ({
  totals,
  saving,
  comparison,
  perishableNames,
}: BasketSummaryProps): ReactElement => (
  <div className='rounded-xl border border-text-muted/20 p-4 text-text-muted'>
    <p className='flex flex-wrap items-baseline gap-x-5 gap-y-2'>
      <span>
        <span className='text-2xl font-semibold text-text'>
          {formatMoney(totals.tripCost)}
        </span>{' '}
        before tax
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
      <table className='mt-3 w-full text-sm'>
        <thead>
          <tr className='text-xs tracking-wide uppercase'>
            <td />
            <th scope='col' className='pl-6 text-right font-normal'>
              Together
            </th>
            <th scope='col' className='pl-6 text-right font-normal'>
              Separately
            </th>
          </tr>
        </thead>
        <tbody>
          <ComparisonRow
            label='At the register'
            together={totals.tripCost}
            separately={totals.tripCost + saving}
          />
          <ComparisonRow
            label='Left over for later'
            together={comparison.leftoverTogether}
            separately={comparison.leftoverAlone}
          />
        </tbody>
      </table>
    )}
    {totals.perishableLeftoverCost >= WASTE_NOTE_MIN && (
      <p className='mt-2 text-sm italic'>
        About {formatMoney(totals.perishableLeftoverCost)} of{' '}
        {listNames(perishableNames).toLowerCase()} may spoil before you use{' '}
        {perishableNames.length > 1 ? 'them' : 'it'}.
      </p>
    )}
  </div>
)
