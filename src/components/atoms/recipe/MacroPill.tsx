import type { ReactElement } from 'react'

export type MacroTone = 'carbs' | 'fat' | 'protein'

// Written out in full so Tailwind can see every class
const TONES: Record<MacroTone, string> = {
  carbs: 'bg-carbs/25',
  fat: 'bg-fat/25',
  protein: 'bg-protein/25',
}

const NEUTRAL = 'bg-background'

type MacroPillProps = {
  label: string
  // Share of calories, the number the pill leads with
  percent: number
  grams: number
  // The big version used on the recipe page, the small one fits a card
  large?: boolean
  // Tints the pill with its macro's color. Plain when left out.
  tone?: MacroTone
}

export const MacroPill = ({
  label,
  percent,
  grams,
  large = false,
  tone,
}: MacroPillProps): ReactElement => (
  <div
    className={`flex size-full flex-col items-center justify-center rounded-lg border border-text-muted/30 text-center text-text ${tone ? TONES[tone] : NEUTRAL} ${large ? 'px-2 py-3' : 'px-2 py-1.5'}`}
  >
    <span
      className={`leading-tight font-semibold ${large ? 'text-2xl' : 'text-base'}`}
    >
      {percent}%
    </span>
    <span className={`text-text-muted ${large ? 'text-sm' : 'text-xs'}`}>
      {label}
    </span>
    <span
      className={`leading-tight text-text-muted ${large ? 'text-xs' : 'text-[0.65rem]'}`}
    >
      {grams}g
    </span>
  </div>
)
