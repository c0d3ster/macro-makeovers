import type { ReactElement } from 'react'

import type { GrocerInfo } from '@/libs/grocery'

type GrocerChoiceProps = {
  info: GrocerInfo
  checked: boolean
  onSelect: () => void
}

// One grocer in the picker, with what checkout costs beyond our estimate said up front
export const GrocerChoice = ({
  info: { id, name, summary, feeNote, priceNote },
  checked,
  onSelect,
}: GrocerChoiceProps): ReactElement => (
  <label
    className={`flex cursor-pointer gap-3 rounded-lg border p-3 transition-colors ${
      checked ? 'border-primary bg-primary/5' : 'border-text-muted/30 hover:border-primary/60'
    }`}
  >
    <input
      type='radio'
      name='grocer'
      value={id}
      checked={checked}
      onChange={onSelect}
      className='mt-1 accent-primary'
    />
    <span className='flex flex-col gap-1'>
      <span className='font-medium text-text'>{name}</span>
      <span className='text-sm text-text-muted'>{summary}</span>
      <span className='text-sm text-text-muted'>{feeNote}</span>
      {priceNote && <span className='text-sm font-medium text-text'>{priceNote}</span>}
    </span>
  </label>
)
