import type { ReactElement } from 'react'

const MAX_DIFFICULTY = 5

type DifficultyDotsProps = {
  level: number
}

export const DifficultyDots = ({
  level,
}: DifficultyDotsProps): ReactElement => (
  <span
    role='img'
    aria-label={`Difficulty ${level} of ${MAX_DIFFICULTY}`}
    className='inline-flex items-center gap-0.5'
  >
    {Array.from({ length: MAX_DIFFICULTY }, (_, index) => (
      <span
        key={index}
        aria-hidden='true'
        className={`size-1.5 rounded-full ${index < level ? 'bg-primary' : 'bg-text-muted/30'}`}
      />
    ))}
  </span>
)
