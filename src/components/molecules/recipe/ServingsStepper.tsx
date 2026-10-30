import type { ReactElement } from 'react'

const MIN_SERVINGS = 1
const MAX_SERVINGS = 24

type ServingsStepperProps = {
  servings: number
  onChange: (servings: number) => void
}

const stepButton =
  'flex size-10 items-center justify-center rounded-full bg-background text-xl text-text transition-colors hover:bg-primary focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-background'

export const ServingsStepper = ({
  servings,
  onChange,
}: ServingsStepperProps): ReactElement => (
  <div className='flex items-center gap-3'>
    <button
      type='button'
      aria-label='Fewer servings'
      className={stepButton}
      disabled={servings <= MIN_SERVINGS}
      onClick={() => onChange(servings - 1)}
    >
      -
    </button>
    <output aria-live='polite' className='min-w-20 text-center text-text'>
      <span className='text-xl font-semibold'>{servings}</span>{' '}
      <span className='text-sm text-text-muted'>
        {servings === 1 ? 'serving' : 'servings'}
      </span>
    </output>
    <button
      type='button'
      aria-label='More servings'
      className={stepButton}
      disabled={servings >= MAX_SERVINGS}
      onClick={() => onChange(servings + 1)}
    >
      +
    </button>
  </div>
)
