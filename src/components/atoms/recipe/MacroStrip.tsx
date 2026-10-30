import type { ReactElement } from 'react'

import type { MacroTone } from './MacroPill'

type MacroStripProps = {
  // Share of calories in carbs, fat, protein order
  segments: { tone: MacroTone; percent: number }[]
  label: string
}

// Written out in full so Tailwind can see every class
const TONES: Record<MacroTone, string> = {
  carbs: 'bg-carbs',
  fat: 'bg-fat',
  protein: 'bg-protein',
}

// A slim, faded bar that only shows the proportions. The numbers live elsewhere.
export const MacroStrip = ({
  segments,
  label,
}: MacroStripProps): ReactElement => (
  <div
    role='img'
    aria-label={label}
    className='flex h-1 w-full gap-0.5 opacity-30'
  >
    {segments.map(({ tone, percent }) => (
      <div
        key={tone}
        className={`rounded-full ${TONES[tone]}`}
        style={{ flexGrow: percent, flexBasis: 0 }}
      />
    ))}
  </div>
)
