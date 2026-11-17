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
  // Outlined is an unused step on the recipe page scale: it reads as empty, not as mild heat
  isOutline?: boolean
  // Chilis overlap a little by default. The recipe page scale spaces them like the difficulty
  // dots instead, so the two scales line up side by side.
  isSpaced?: boolean
}

export const ChiliIcon = ({
  isDimmed = false,
  isOutline = false,
  isSpaced = false,
}: ChiliIconProps): ReactElement => (
  <svg
    aria-hidden='true'
    viewBox='0 0 24 24'
    className={`size-4 ${isSpaced ? '-mx-px' : '-mx-0.5'} ${isDimmed ? 'opacity-30 grayscale' : ''}`}
  >
    <path
      d={CHILI_POD_PATH}
      {...(isOutline
        ? { fill: 'none', strokeWidth: 1.4, className: 'stroke-text-muted/50' }
        : { className: 'fill-spice' })}
    />
    <path
      d={CHILI_STEM_PATH}
      fill='none'
      strokeWidth={1.8}
      strokeLinecap='round'
      className={isOutline ? 'stroke-text-muted/50' : 'stroke-spice-stem'}
    />
  </svg>
)

type SpiceLevelProps = {
  level: number
  // Also draw the unused steps as outlines, for the recipe page where there's room for the scale.
  // Cards leave it off, so a mild dish doesn't look hot at a glance.
  showScale?: boolean
}

// One lit chili per level. Only render it for a spicy recipe.
export const SpiceLevel = ({
  level,
  showScale = false,
}: SpiceLevelProps): ReactElement => {
  const label = `${spiceLabel(level)} heat, ${level} of ${MAX_SPICE_LEVEL}`

  return (
    <span
      role='img'
      aria-label={label}
      title={label}
      className={`inline-flex items-center ${showScale ? 'translate-y-[3px]' : ''}`}
    >
      {Array.from({ length: showScale ? MAX_SPICE_LEVEL : level }, (_, index) => (
        <ChiliIcon key={index} isOutline={index >= level} isSpaced={showScale} />
      ))}
    </span>
  )
}
