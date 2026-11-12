import type { ReactElement } from 'react'

import Link from 'next/link'

import type { RecipeCard as RecipeCardData } from '@/libs/recipes'

import { MacroStrip, RecipeImage } from '@/components/atoms'
import { cardHref, formatMacroRatios, toMacroRatios } from '@/libs/recipes'

const COURSE_LABELS: Partial<Record<RecipeCardData['course'], string>> = {
  side: 'Side',
  sauce: 'Sauce',
}

// The thumbnail is 6rem wide at every breakpoint
const THUMB_SIZES = '96px'

type CompactRecipeCardProps = {
  recipe: RecipeCardData
}

// A side or sauce in a short row: a small photo, the name, and the macros per serving. No summary
// or tags, so a whole section of them takes about the room of one row of full cards.
export const CompactRecipeCard = ({
  recipe,
}: CompactRecipeCardProps): ReactElement => {
  const {
    title,
    imageUrl,
    course,
    calories,
    carbsG,
    fatG,
    proteinG,
    build,
    usedInCount,
  } = recipe
  const { carbsPct, fatPct, proteinPct } = toMacroRatios({
    carbsG,
    fatG,
    proteinG,
  })
  const courseLabel = COURSE_LABELS[course]

  return (
    <Link
      href={cardHref(recipe)}
      className='group flex h-full items-center gap-4 rounded-xl bg-surface p-3 transition-colors hover:bg-surface/80 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none'
    >
      <div className='w-24 shrink-0 overflow-hidden rounded-lg'>
        <RecipeImage
          imageUrl={imageUrl}
          title={title}
          sizes={THUMB_SIZES}
          priority={false}
          rounded={false}
          zoomOnHover
          thumbnail
        />
      </div>
      <div className='flex min-w-0 flex-1 flex-col gap-1.5'>
        <h3 className='line-clamp-2 text-base leading-snug font-semibold text-text group-hover:text-primary'>
          {title}
        </h3>
        {!build.isDefault && (
          <p className='truncate text-xs font-medium text-primary'>
            Build: {build.label}
          </p>
        )}
        <p className='flex flex-wrap items-baseline gap-x-3 text-sm text-text-muted'>
          <span>
            <span className='font-semibold text-text'>{calories}</span> cal
          </span>
          <span>
            <span className='font-semibold text-text'>{proteinG}g</span>{' '}
            protein
          </span>
          <span>C/F/P {formatMacroRatios({ carbsG, fatG, proteinG })}</span>
        </p>
        <MacroStrip
          faded={false}
          aligned={false}
          label={`Calories by macro: ${carbsPct}% carbs, ${fatPct}% fat, ${proteinPct}% protein`}
          segments={[
            { tone: 'carbs', percent: carbsPct },
            { tone: 'fat', percent: fatPct },
            { tone: 'protein', percent: proteinPct },
          ]}
        />
        <p className='text-xs text-text-muted'>
          {[
            courseLabel,
            usedInCount > 0 &&
              `Used in ${usedInCount} ${usedInCount === 1 ? 'recipe' : 'recipes'}`,
          ]
            .filter(Boolean)
            .join(' · ')}
        </p>
      </div>
    </Link>
  )
}
