import type { ReactElement } from 'react'

const MAX_TIER = 5

type CostTierProps = {
  tier: number
}

// $ to $$$$$ with the unused signs dimmed, so "$$" reads at a glance next to "$$$$"
export const CostTier = ({ tier }: CostTierProps): ReactElement => (
  <span
    role='img'
    aria-label={`Cost ${tier} of ${MAX_TIER}`}
    className='inline-flex gap-0.5 font-medium'
  >
    {Array.from({ length: MAX_TIER }, (_, index) => (
      <span
        key={index}
        aria-hidden='true'
        className={index < tier ? 'text-accent' : 'text-text-muted/40'}
      >
        $
      </span>
    ))}
  </span>
)
