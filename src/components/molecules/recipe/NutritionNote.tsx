import type { ReactElement } from 'react'

import Link from 'next/link'

type NutritionNoteProps = {
  className?: string
}

// The short disclaimer shown wherever a nutrition total is, linking to the full page
export const NutritionNote = ({
  className = '',
}: NutritionNoteProps): ReactElement => (
  <p className={`text-xs text-text-muted ${className}`}>
    Calories and macros are estimates, not medical advice.{' '}
    <Link href='/nutrition-disclaimer' className='underline hover:text-text'>
      About the numbers
    </Link>
  </p>
)
