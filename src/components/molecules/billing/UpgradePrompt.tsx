import type { ReactElement } from 'react'

import { Button } from '@/components/atoms'

import { PlanFeatureList } from './PlanFeatureList'

type UpgradePromptProps = {
  title?: string
}

// Shown where a paid feature was asked for without the plan, including when a resolver answers
// SUBSCRIPTION_REQUIRED
export const UpgradePrompt = ({
  title = 'This comes with the paid plan',
}: UpgradePromptProps): ReactElement => (
  <div role='status' className='grid gap-4 rounded-xl bg-surface p-5'>
    <p className='text-lg font-semibold text-text'>{title}</p>
    <PlanFeatureList compact />
    <p className='text-sm text-text-muted'>
      Every recipe, the basket, favorites, and reviews stay free.
    </p>
    <div>
      <Button href='/pricing' size='sm'>
        See the plan
      </Button>
    </div>
  </div>
)
