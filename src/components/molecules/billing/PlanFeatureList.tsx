import type { ReactElement } from 'react'

import { FREE_FEATURES, PAID_FEATURES } from './planFeatures'

type PlanFeatureListProps = {
  // Compact drops the details and the free list, for upgrade prompts
  compact?: boolean
}

export const PlanFeatureList = ({
  compact = false,
}: PlanFeatureListProps): ReactElement => (
  <div className='grid gap-6'>
    <div>
      <h3 className='mb-3 font-semibold text-text'>The paid plan adds</h3>
      <ul className='grid gap-3'>
        {PAID_FEATURES.map(({ title, detail, available }) => (
          <li key={title}>
            <span className='font-medium text-text'>{title}</span>
            {!available && (
              <span className='ml-2 rounded-full bg-accent/20 px-2 py-0.5 text-xs text-text'>
                Coming soon
              </span>
            )}
            {!compact && <p className='text-sm text-text-muted'>{detail}</p>}
          </li>
        ))}
      </ul>
    </div>
    {!compact && (
      <div>
        <h3 className='mb-3 font-semibold text-text'>Free for everyone</h3>
        <ul className='grid list-disc gap-1 pl-5 text-text-muted'>
          {FREE_FEATURES.map((feature) => (
            <li key={feature}>{feature}</li>
          ))}
        </ul>
      </div>
    )}
  </div>
)
