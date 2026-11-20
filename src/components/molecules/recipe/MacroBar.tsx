import type { CSSProperties, ReactElement } from 'react'

import type { MacroTone } from '@/components/atoms'

import { MacroPill } from '@/components/atoms'

type Macro = {
  label: string
  tone: MacroTone
  // Share of calories, which sets how wide the segment is
  percent: number
  grams: number
  // The original recipe's share. With reveal, the segment grows from this to percent,
  // or from nothing when there is no original.
  fromPercent?: number
}

type MacroBarProps = {
  macros: Macro[]
  // The smaller version for recipe cards
  compact?: boolean
  // Plays the grow-then-show-numbers animation on load
  reveal?: boolean
}

// One bar split by share of calories, so a protein-heavy recipe reads protein-heavy at a glance.
// Each pill's floor is its own text (a flex item's default min-width), so a small share stays
// readable without being padded past its true width on narrow screens.
export const MacroBar = ({
  macros,
  compact = false,
  reveal = false,
}: MacroBarProps): ReactElement => (
  <div
    className={`flex gap-2 ${reveal ? 'relative z-10' : ''}`}
    role='group'
    aria-label='Calories by macro'
  >
    {macros.map(({ label, tone, percent, grams, fromPercent }) => (
      <div
        key={label}
        className={
          reveal
            ? fromPercent === undefined
              ? 'macro-reveal-pill-from-zero'
              : 'macro-reveal-pill'
            : undefined
        }
        style={
          {
            flexGrow: percent,
            flexBasis: 0,
            '--macro-from': fromPercent,
          } as CSSProperties
        }
      >
        <MacroPill
          label={label}
          tone={tone}
          percent={percent}
          grams={grams}
          large={!compact}
          reveal={reveal}
        />
      </div>
    ))}
  </div>
)
