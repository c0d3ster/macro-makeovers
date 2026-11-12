import type { ReactElement } from 'react'

import Link from 'next/link'

import type { RecipeCard as RecipeCardData } from '@/libs/recipes'

import { MacroDonut, RecipeImage } from '@/components/atoms'
import { cardHref, toMacroRatios } from '@/libs/recipes'

const COURSE_LABELS: Partial<Record<RecipeCardData['course'], string>> = {
  side: 'Side',
  sauce: 'Sauce',
}

// The thumbnail is 6rem wide at every breakpoint
const THUMB_SIZES = '96px'

// Written out in full so Tailwind can see every class
const DOTS = {
  carbs: 'bg-carbs',
  fat: 'bg-fat',
  protein: 'bg-protein',
} as const

type CompactRecipeCardProps = {
  recipe: RecipeCardData
}

// A side or sauce in a short row: a small photo, the name, and the macros per serving as a donut
// with grams and shares beside it, in carbs, fat, protein order. Sides and sauces are rarely
// protein-heavy, so no single macro leads. No summary or tags, so a whole section of them takes
// about the room of one row of full cards.
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
  const macros = [
    { tone: 'carbs', label: 'Carbs', grams: carbsG, percent: carbsPct },
    { tone: 'fat', label: 'Fat', grams: fatG, percent: fatPct },
    { tone: 'protein', label: 'Protein', grams: proteinG, percent: proteinPct },
  ] as const

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
        <div className='flex items-center gap-3'>
          <MacroDonut
            calories={calories}
            carbsG={carbsG}
            fatG={fatG}
            proteinG={proteinG}
          />
          <ul className='flex flex-col gap-0.5 text-sm text-text-muted'>
            {macros.map(({ tone, label, grams, percent }) => (
              <li key={tone} className='flex items-center gap-1.5'>
                <span
                  aria-hidden='true'
                  className={`size-2 shrink-0 rounded-full ${DOTS[tone]}`}
                />
                <span className='w-10 font-semibold text-text tabular-nums'>
                  {grams}g
                </span>
                <span>
                  {label} ({percent}%)
                </span>
              </li>
            ))}
          </ul>
        </div>
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
