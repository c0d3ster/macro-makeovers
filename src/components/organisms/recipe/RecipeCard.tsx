import type { ReactElement } from 'react'

import Link from 'next/link'

import type { RecipeCard as RecipeCardData } from '@/libs/recipes'

import { Badge, CostTier, DifficultyDots, MacroPill } from '@/components/atoms'
import { formatMinutes } from '@/utils/formatMinutes'

const MAX_TAGS = 3

type RecipeCardProps = {
  recipe: RecipeCardData
}

export const RecipeCard = ({ recipe }: RecipeCardProps): ReactElement => {
  const {
    slug,
    title,
    summary,
    totalMinutes,
    costTier,
    difficulty,
    tags,
    calories,
    proteinG,
    carbsG,
    fatG,
  } = recipe

  return (
    <Link
      href={`/recipes/${slug}`}
      className='group flex h-full flex-col gap-4 rounded-xl bg-surface p-5 transition-colors hover:bg-surface/80 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none'
    >
      <div className='flex flex-col gap-2'>
        <h3 className='text-lg font-semibold text-text group-hover:text-primary'>
          {title}
        </h3>
        <p className='line-clamp-3 text-sm text-text-muted'>{summary}</p>
      </div>

      <div className='mt-auto grid grid-cols-4 gap-2'>
        <MacroPill label='Protein' value={proteinG} unit='g' featured />
        <MacroPill label='Cal' value={calories} />
        <MacroPill label='Carbs' value={carbsG} unit='g' />
        <MacroPill label='Fat' value={fatG} unit='g' />
      </div>

      <div className='flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-text-muted'>
        <span>{formatMinutes(totalMinutes)}</span>
        <CostTier tier={costTier} />
        <DifficultyDots level={difficulty} />
      </div>

      {tags.length > 0 && (
        <ul className='flex flex-wrap gap-1.5'>
          {tags.slice(0, MAX_TAGS).map((tag) => (
            <li key={tag}>
              <Badge>{tag}</Badge>
            </li>
          ))}
        </ul>
      )}
    </Link>
  )
}
