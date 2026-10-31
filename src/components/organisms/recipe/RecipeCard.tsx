import type { ReactElement } from 'react'

import Link from 'next/link'

import type { Fit, RecipeCard as RecipeCardData } from '@/libs/recipes'

import {
  Badge,
  CostTier,
  DifficultyDots,
  MacroStrip,
  RecipeImage,
} from '@/components/atoms'
import { MacroBar } from '@/components/molecules'
import { toMacroRatios } from '@/libs/recipes'
import { formatMinutes } from '@/utils/formatMinutes'

const MAX_TAGS = 3

// The grid is three columns from the large breakpoint, two from small, one on a phone
const CARD_PHOTO_SIZES =
  '(min-width: 1024px) 370px, (min-width: 640px) 50vw, 100vw'

type RecipeCardProps = {
  recipe: RecipeCardData
  // How well the recipe fits the active goal or macro targets. Missing when none is active.
  fit?: Fit
}

export const RecipeCard = ({ recipe, fit }: RecipeCardProps): ReactElement => {
  const {
    slug,
    title,
    summary,
    imageUrl,
    servings,
    totalMinutes,
    costTier,
    difficulty,
    tags,
    calories,
    proteinG,
    carbsG,
    fatG,
    original,
  } = recipe
  const { proteinPct, carbsPct, fatPct } = toMacroRatios({
    proteinG,
    carbsG,
    fatG,
  })

  const originalRatios = original && toMacroRatios(original)

  return (
    <Link
      href={`/recipes/${slug}`}
      className={`group flex h-full flex-col overflow-hidden rounded-xl bg-surface transition-colors hover:bg-surface/80 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none ${
        fit?.isFit ? 'outline-2 outline-primary' : ''
      } ${fit && !fit.isFit ? 'opacity-90' : ''}`}
    >
      {imageUrl && (
        <RecipeImage
          imageUrl={imageUrl}
          title={title}
          sizes={CARD_PHOTO_SIZES}
          priority={false}
          rounded={false}
          zoomOnHover
        />
      )}
      <div className='flex flex-1 flex-col gap-4 p-5'>
        {fit?.isFit && (
          <p className='flex min-h-6 items-center text-xs'>
            <span className='inline-flex items-center gap-1 rounded-full border border-primary px-2 py-0.5 font-medium text-primary'>
              <svg
                aria-hidden='true'
                viewBox='0 0 16 16'
                className='size-3'
                fill='none'
                stroke='currentColor'
                strokeWidth='2'
                strokeLinecap='round'
                strokeLinejoin='round'
              >
                <path d='M3 8.5l3.5 3.5L13 5' />
              </svg>
              Good fit
            </span>
          </p>
        )}
        {fit && !fit.isFit && fit.reasons.length > 0 && (
          <ul className='flex flex-col gap-0.5 text-xs text-text-muted'>
            {fit.reasons.map((reason) => (
              <li key={reason}>{reason}</li>
            ))}
          </ul>
        )}
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
              {
                label: 'Carbs',
                tone: 'carbs',
                percent: carbsPct,
                grams: carbsG,
              },
              { label: 'Fat', tone: 'fat', percent: fatPct, grams: fatG },
              {
                label: 'Protein',
                tone: 'protein',
                percent: proteinPct,
                grams: proteinG,
              },
            ]}
          />
          {originalRatios && (
            <MacroStrip
              label={`Original recipe calories by macro: ${originalRatios.carbsPct}% carbs, ${originalRatios.fatPct}% fat, ${originalRatios.proteinPct}% protein`}
              segments={[
                { tone: 'carbs', percent: originalRatios.carbsPct },
                { tone: 'fat', percent: originalRatios.fatPct },
                { tone: 'protein', percent: originalRatios.proteinPct },
              ]}
            />
          )}
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
      </div>
    </Link>
  )
}
