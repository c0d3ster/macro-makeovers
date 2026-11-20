import type { ReactElement } from 'react'

import type { MacroTone } from './MacroPill'

type MacroStripProps = {
  // Share of calories in carbs, fat, protein order
  segments: { tone: MacroTone; percent: number }[]
  label: string
  // 4px on a card, 6px on the recipe page
  large?: boolean
  // Drops in from under the bar above it while that bar morphs
  reveal?: boolean
}

// Written out in full so Tailwind can see every class
const TONES: Record<MacroTone, string> = {
  carbs: 'bg-carbs',
  fat: 'bg-fat',
  protein: 'bg-protein',
}

// A slim, faded bar that only shows the proportions. The numbers live elsewhere. The gap matches
// the MacroBar pills. With no text to fit, segments keep their true share down to a sliver.
export const MacroStrip = ({
  segments,
  label,
  large = false,
  reveal = false,
}: MacroStripProps): ReactElement => (
  <div
    role='img'
    aria-label={label}
    className={`flex w-full gap-2 opacity-20 ${large ? 'h-1.5' : 'h-1'} ${reveal ? 'macro-reveal-strip' : ''}`}
  >
    {segments.map(({ tone, percent }) => (
      <div
        key={tone}
        className={`min-w-1 rounded-full ${TONES[tone]}`}
        style={{ flexGrow: percent, flexBasis: 0 }}
      />
    ))}
  </div>
)
