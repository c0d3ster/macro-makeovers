import type { ReactElement } from 'react'

import { MacroPill } from '@/components/atoms'

type Macro = {
  label: string
  // Share of calories, which sets how wide the segment is
  percent: number
  grams: number
}

type MacroBarProps = {
  macros: Macro[]
}

// One bar split by share of calories, so a protein-heavy recipe reads protein-heavy at a glance.
// The floor width keeps a small share, like 15% fat, wide enough for its text.
export const MacroBar = ({ macros }: MacroBarProps): ReactElement => (
  <div className='flex gap-2' role='group' aria-label='Calories by macro'>
    {macros.map(({ label, percent, grams }) => (
      <div
        key={label}
        className='min-w-22'
        style={{ flexGrow: percent, flexBasis: 0 }}
      >
        <MacroPill label={label} percent={percent} grams={grams} large />
      </div>
    ))}
  </div>
)
