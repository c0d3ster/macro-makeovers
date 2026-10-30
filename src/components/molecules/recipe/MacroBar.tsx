import type { ReactElement } from 'react'

import type { MacroTone } from '@/components/atoms'

import { MacroPill } from '@/components/atoms'

type Macro = {
  label: string
  tone: MacroTone
  // Share of calories, which sets how wide the segment is
  percent: number
  grams: number
}

type MacroBarProps = {
  macros: Macro[]
  // The smaller version for recipe cards
  compact?: boolean
}

// One bar split by share of calories, so a protein-heavy recipe reads protein-heavy at a glance.
// The floor width keeps a small share, like 15% fat, wide enough for its text.
export const MacroBar = ({
  macros,
  compact = false,
}: MacroBarProps): ReactElement => (
  <div className='flex gap-2' role='group' aria-label='Calories by macro'>
    {macros.map(({ label, tone, percent, grams }) => (
      <div
        key={label}
        className={compact ? 'min-w-14' : 'min-w-22'}
        style={{ flexGrow: percent, flexBasis: 0 }}
      >
        <MacroPill
          label={label}
          tone={tone}
          percent={percent}
          grams={grams}
          large={!compact}
        />
      </div>
    ))}
  </div>
)
