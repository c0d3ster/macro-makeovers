import type { ReactElement } from 'react'

import Link from 'next/link'

import { GOALS } from '@/libs/recipes'

// One card per goal, each opening the recipe list ranked for that goal
export const GoalLinks = (): ReactElement => (
  <ul className='grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3'>
    {GOALS.map(({ id, label, note }) => (
      <li key={id}>
        <Link
          href={`/recipes?goal=${id}`}
          className='flex h-full flex-col rounded-xl bg-surface p-4 transition-colors hover:bg-surface/80 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none'
        >
          <span className='font-semibold text-text'>{label}</span>
          <span className='mt-1 text-sm text-text-muted'>{note}</span>
        </Link>
      </li>
    ))}
  </ul>
)
