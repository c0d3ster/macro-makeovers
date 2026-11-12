import type { ReactElement } from 'react'

import {
  CHILI_POD_PATH,
  CHILI_STEM_PATH,
  MAX_SPICE_LEVEL,
  spiceLabel,
} from '@/libs/recipes/spiceLevels'

type ChiliIconProps = {
  // Dimmed is for an unpicked step in the admin picker
  isDimmed?: boolean
}

export const ChiliIcon = ({ isDimmed = false }: ChiliIconProps): ReactElement => (
  <svg
    aria-hidden='true'
    viewBox='0 0 24 24'
    className={`-mx-0.5 size-4 ${isDimmed ? 'opacity-30 grayscale' : ''}`}
  >
    <path d={CHILI_POD_PATH} className='fill-spice' />
    <path
      d={CHILI_STEM_PATH}
      fill='none'
      strokeWidth={1.8}
      strokeLinecap='round'
      className='stroke-spice-stem'
    />
  </svg>
)

type SpiceLevelProps = {
  level: number
}

// One lit chili per level and no dimmed ones, so it reads as a heat badge rather than a rating.
// Only render it for a spicy recipe.
export const SpiceLevel = ({ level }: SpiceLevelProps): ReactElement => {
  const label = `${spiceLabel(level)} heat, ${level} of ${MAX_SPICE_LEVEL}`

  return (
    <span
      role='img'
      aria-label={label}
      title={label}
      className='inline-flex items-center'
    >
      {Array.from({ length: level }, (_, index) => (
        <ChiliIcon key={index} />
      ))}
    </span>
  )
}
