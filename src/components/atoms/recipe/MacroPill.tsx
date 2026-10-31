import type { ReactElement } from 'react'

export type MacroTone = 'carbs' | 'fat' | 'protein'

// The 35% tint of each macro color, mixed over what the pill sits on so the fill is fully
// opaque and the page's % pattern can't show through. Written out in full so Tailwind can see
// every class.
const PAGE_TONES: Record<MacroTone, string> = {
  carbs: 'bg-[color-mix(in_srgb,var(--color-carbs)_35%,var(--c-background))]',
  fat: 'bg-[color-mix(in_srgb,var(--color-fat)_35%,var(--c-background))]',
  protein:
    'bg-[color-mix(in_srgb,var(--color-protein)_35%,var(--c-background))]',
}

// Cards sit on the surface color, not the page
const CARD_TONES: Record<MacroTone, string> = {
  carbs: 'bg-[color-mix(in_srgb,var(--color-carbs)_35%,var(--c-surface))]',
  fat: 'bg-[color-mix(in_srgb,var(--color-fat)_35%,var(--c-surface))]',
  protein: 'bg-[color-mix(in_srgb,var(--color-protein)_35%,var(--c-surface))]',
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
  // Fades the numbers in late, after the bar has finished growing
  reveal?: boolean
}

const REVEAL = 'macro-reveal-late'

export const MacroPill = ({
  label,
  percent,
  grams,
  large = false,
  tone,
  reveal = false,
}: MacroPillProps): ReactElement => (
  <div
    className={`flex size-full flex-col items-center justify-center rounded-lg border border-text-muted/30 text-center text-text ${tone ? (large ? PAGE_TONES : CARD_TONES)[tone] : NEUTRAL} ${reveal ? 'macro-reveal-fill' : ''} ${large ? 'px-2 py-3' : 'px-2 py-1.5'}`}
  >
    <span
      className={`leading-tight font-semibold ${large ? 'text-2xl' : 'text-base'} ${reveal ? REVEAL : ''}`}
    >
      {percent}%
    </span>
    <span
      className={`text-text-muted ${large ? 'text-sm' : 'text-xs'} ${reveal ? REVEAL : ''}`}
    >
      {label}
    </span>
    <span
      className={`leading-tight text-text-muted ${large ? 'text-xs' : 'text-[0.65rem]'} ${reveal ? REVEAL : ''}`}
    >
      {grams}g
    </span>
  </div>
)
