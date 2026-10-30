import type { ReactElement } from 'react'

const MIN_SERVINGS = 1
const MAX_SERVINGS = 24

type ServingsStepperProps = {
  servings: number
  onChange: (servings: number) => void
}

const stepButton =
  'flex size-10 items-center justify-center rounded-full bg-background text-text transition-colors hover:bg-primary hover:text-on-primary focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-background disabled:hover:text-text'

// Drawn as a shape instead of a "+" or "-" character, so it sits dead center in the circle
const StepIcon = ({ plus }: { plus: boolean }): ReactElement => (
  <svg
    aria-hidden='true'
    viewBox='0 0 16 16'
    className='size-4'
    fill='none'
    stroke='currentColor'
    strokeWidth='2'
    strokeLinecap='round'
  >
    <path d={plus ? 'M8 3v10M3 8h10' : 'M3 8h10'} />
  </svg>
)

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
      <StepIcon plus={false} />
    </button>
    <output
      aria-live='polite'
      className='flex min-w-24 items-center justify-center gap-1.5 text-text'
    >
      <span className='text-xl leading-none font-semibold'>{servings}</span>
      <span className='text-sm leading-none text-text-muted'>
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
      <StepIcon plus />
    </button>
  </div>
)
