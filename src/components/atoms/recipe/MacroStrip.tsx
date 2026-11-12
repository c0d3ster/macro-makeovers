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
  // Faded under a macro bar. Full strength where it is the only macro graphic, as on a compact card.
  faded?: boolean
  // Minimum widths that line the segments up with the MacroBar pills. Off where there is no bar
  // to line up with and little room, as on a compact card.
  aligned?: boolean
}

// Written out in full so Tailwind can see every class
const TONES: Record<MacroTone, string> = {
  carbs: 'bg-carbs',
  fat: 'bg-fat',
  protein: 'bg-protein',
}

// A slim, faded bar that only shows the proportions. The numbers live elsewhere. The gap and
// minimum widths match the MacroBar pills so its segments line up with theirs edge to edge.
export const MacroStrip = ({
  segments,
  label,
  large = false,
  reveal = false,
  faded = true,
  aligned = true,
}: MacroStripProps): ReactElement => (
  <div
    role='img'
    aria-label={label}
    className={`flex w-full gap-2 ${faded ? 'opacity-20' : ''} ${large ? 'h-1.5' : 'h-1'} ${reveal ? 'macro-reveal-strip' : ''}`}
  >
    {segments.map(({ tone, percent }) => (
      <div
        key={tone}
        className={`rounded-full ${aligned ? (large ? 'min-w-22' : 'min-w-14') : ''} ${TONES[tone]}`}
        style={{ flexGrow: percent, flexBasis: 0 }}
      />
    ))}
  </div>
)
