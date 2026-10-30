import type { ReactElement } from 'react'

import type { RecipeStep } from '@/libs/recipes'

import { Markdown } from '@/components/atoms'
import { formatMinutes } from '@/utils/formatMinutes'

type StepListProps = {
  steps: RecipeStep[]
  prepMinutes: number
  cookMinutes: number
}

export const StepList = ({
  steps,
  prepMinutes,
  cookMinutes,
}: StepListProps): ReactElement => {
  const phases: {
    phase: RecipeStep['phase']
    title: string
    minutes: number
  }[] = [
    { phase: 'prep', title: 'Prep', minutes: prepMinutes },
    { phase: 'cook', title: 'Cook', minutes: cookMinutes },
  ]

  // Numbering runs straight through prep into cook, so "step 6" is unambiguous
  let number = 0

  return (
    <section aria-labelledby='steps-heading' className='flex flex-col gap-6'>
      <h2 id='steps-heading' className='text-2xl font-semibold text-text'>
        Steps
      </h2>

      {phases.map(({ phase, title, minutes }) => {
        const phaseSteps = steps.filter((step) => step.phase === phase)
        if (phaseSteps.length === 0) return null

        return (
          <div key={phase}>
            <h3 className='mb-3 text-sm font-semibold tracking-wide text-accent uppercase'>
              {title}{' '}
              <span className='font-normal tracking-normal text-text-muted normal-case'>
                (~{formatMinutes(minutes)})
              </span>
            </h3>
            <ol className='flex flex-col gap-4'>
              {phaseSteps.map(({ body, durationMinutes }) => {
                number += 1
                return (
                  <li key={body} className='flex gap-4'>
                    <span
                      aria-hidden='true'
                      className='flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-on-primary'
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
