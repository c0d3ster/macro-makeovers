import type { ReactElement } from 'react'

import type { RecipeStep } from '@/libs/recipes'

import { Markdown } from '@/components/atoms'
import { formatMinutes } from '@/utils/formatMinutes'

type StepListProps = {
  steps: RecipeStep[]
}

const PHASES: { phase: RecipeStep['phase']; title: string }[] = [
  { phase: 'prep', title: 'Prep' },
  { phase: 'cook', title: 'Cook' },
]

export const StepList = ({ steps }: StepListProps): ReactElement => {
  // Numbering runs straight through prep into cook, so "step 6" is unambiguous
  let number = 0

  return (
    <section aria-labelledby='steps-heading' className='flex flex-col gap-6'>
      <h2 id='steps-heading' className='text-2xl font-semibold text-text'>
        Steps
      </h2>

      {PHASES.map(({ phase, title }) => {
        const phaseSteps = steps.filter((step) => step.phase === phase)
        if (phaseSteps.length === 0) return null

        return (
          <div key={phase}>
            <h3 className='mb-3 text-sm font-semibold tracking-wide text-accent uppercase'>
              {title}
            </h3>
            <ol className='flex flex-col gap-4'>
              {phaseSteps.map(({ body, durationMinutes }) => {
                number += 1
                return (
                  <li key={body} className='flex gap-4'>
                    <span
                      aria-hidden='true'
                      className='flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-text'
                    >
                      {number}
                    </span>
                    <div className='min-w-0 pt-1 text-text-muted'>
                      <Markdown>{body}</Markdown>
                      {durationMinutes !== undefined && (
                        <p className='mt-1 text-xs text-text-muted'>
                          About {formatMinutes(durationMinutes)}
                        </p>
                      )}
                    </div>
                  </li>
                )
              })}
            </ol>
          </div>
        )
      })}
    </section>
  )
}
