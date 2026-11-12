import type { ReactElement } from 'react'

import { toMacroRatios } from '@/libs/recipes/macroRatios'

type MacroDonutProps = {
  calories: number
  carbsG: number
  fatG: number
  proteinG: number
  // Rendered width and height in pixels
  size?: number
}

// The ring's geometry in viewBox units. A radius of 100 / (2 * PI) makes the circumference 100,
// so each slice's dash length is its percent.
const VIEW = 42
const CENTER = VIEW / 2
const RADIUS = 100 / (2 * Math.PI)
const RING = 4.5

// Written out in full so Tailwind can see every class
const TONES = {
  carbs: 'text-carbs',
  fat: 'text-fat',
  protein: 'text-protein',
} as const

// A four-digit number gets a smaller font so it stays inside the ring
const calorieFontSize = (calories: number): number =>
  String(Math.round(calories)).length >= 4 ? 8.5 : 11

// Calories by macro as a ring, with the calories in the middle. Slices run clockwise from the top
// in carbs, fat, protein order.
export const MacroDonut = ({
  calories,
  carbsG,
  fatG,
  proteinG,
  size = 68,
}: MacroDonutProps): ReactElement => {
  const { carbsPct, fatPct, proteinPct } = toMacroRatios({
    carbsG,
    fatG,
    proteinG,
  })
  const slices = [
    { tone: 'carbs', percent: carbsPct },
    { tone: 'fat', percent: fatPct },
    { tone: 'protein', percent: proteinPct },
  ] as const
  // A dash offset of 25 starts the first slice at twelve o'clock
  const starts = slices.map((_, index) =>
    slices.slice(0, index).reduce((offset, { percent }) => offset - percent, 25)
  )
  const rounded = Math.round(calories)

  return (
    <svg
      viewBox={`0 0 ${VIEW} ${VIEW}`}
      width={size}
      height={size}
      role='img'
      aria-label={`${rounded} calories: ${carbsPct}% carbs, ${fatPct}% fat, ${proteinPct}% protein`}
      className='shrink-0'
    >
      <circle
        cx={CENTER}
        cy={CENTER}
        r={RADIUS}
        fill='none'
        stroke='currentColor'
        strokeWidth={RING}
        className='text-text-muted/15'
      />
      {slices.map(({ tone, percent }, index) =>
        percent > 0 ? (
          <circle
            key={tone}
            cx={CENTER}
            cy={CENTER}
            r={RADIUS}
            fill='none'
            stroke='currentColor'
            strokeWidth={RING}
            strokeDasharray={`${percent} ${100 - percent}`}
            strokeDashoffset={starts[index]}
            className={TONES[tone]}
          />
        ) : null
      )}
      <text
        x={CENTER}
        y={CENTER + 1.5}
        textAnchor='middle'
        className='fill-text font-semibold tabular-nums'
        style={{ fontSize: calorieFontSize(rounded) }}
      >
        {rounded}
      </text>
      <text
        x={CENTER}
        y={CENTER + 7.5}
        textAnchor='middle'
        className='fill-text-muted'
        style={{ fontSize: 5 }}
      >
        cal
      </text>
    </svg>
  )
}
