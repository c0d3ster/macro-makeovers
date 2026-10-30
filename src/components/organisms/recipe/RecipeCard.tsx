import type { ReactElement } from 'react'

import Link from 'next/link'

import type { RecipeCard as RecipeCardData } from '@/libs/recipes'

import { Badge, CostTier, DifficultyDots } from '@/components/atoms'
import { MacroBar } from '@/components/molecules'
import { toMacroRatios } from '@/libs/recipes'
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
    servings,
    totalMinutes,
    costTier,
    difficulty,
    tags,
    calories,
    proteinG,
    carbsG,
    fatG,
  } = recipe
  const { proteinPct, carbsPct, fatPct } = toMacroRatios({
    proteinG,
    carbsG,
    fatG,
  })

  return (
    <Link
      href={`/recipes/${slug}`}
      className='group flex h-full flex-col gap-4 rounded-xl bg-surface p-5 transition-colors hover:bg-surface/80 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none'
    >
      <div className='flex flex-col gap-2'>
        <h3 className='text-lg font-semibold text-text group-hover:text-primary'>
          {title}
        </h3>
        <p className='line-clamp-4 text-sm text-text-muted'>{summary}</p>
      </div>

      <div className='mt-auto flex flex-col gap-2'>
        <div className='flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1'>
          <p className='flex items-baseline gap-1.5'>
            <span className='text-2xl leading-none font-semibold text-text'>
              {calories}
            </span>
            <span className='text-sm text-text-muted'>cals per serving</span>
          </p>
          <p className='flex items-baseline gap-1.5'>
            <span className='text-lg leading-none font-semibold text-text'>
              {servings}
            </span>
            <span className='text-sm text-text-muted'>servings</span>
          </p>
        </div>
        <MacroBar
          compact
          macros={[
            { label: 'Carbs', tone: 'carbs', percent: carbsPct, grams: carbsG },
            { label: 'Fat', tone: 'fat', percent: fatPct, grams: fatG },
            {
              label: 'Protein',
              tone: 'protein',
              percent: proteinPct,
              grams: proteinG,
            },
          ]}
        />
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
