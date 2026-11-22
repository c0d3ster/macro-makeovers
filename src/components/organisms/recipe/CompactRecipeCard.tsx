import type { ReactElement } from 'react'

import Link from 'next/link'

import type { RecipeCard as RecipeCardData } from '@/libs/recipes'

import { MacroDonut, RecipeImage, SpiceLevel } from '@/components/atoms'
import { cardHref, toMacroRatios } from '@/libs/recipes'

const COURSE_LABELS: Partial<Record<RecipeCardData['course'], string>> = {
  appetizer: 'Appetizer',
  side: 'Side',
  sauce: 'Sauce',
}

// The photo is 8.75rem (140px) wide at every breakpoint, 7:6, so 120px tall
const THUMB_SIZES = '140px'

// Written out in full so Tailwind can see every class
const DOTS = {
  carbs: 'bg-carbs',
  fat: 'bg-fat',
  protein: 'bg-protein',
} as const

// The card's hover color as a solid, so the ring around the donut matches the card over the photo
const RING_HOVER =
  'group-hover:bg-[color-mix(in_srgb,var(--color-surface)_80%,var(--color-background))]'

type CompactRecipeCardProps = {
  recipe: RecipeCardData
}

// An appetizer, side, or sauce in a short row: a photo with the macros donut on its corner, then
// the name, the course, and one line per macro. These are rarely protein-heavy, so no single
// macro leads. No summary or tags, so a whole section of them takes about the room of one row of
// full cards.
//
// The geometry, in px: the donut is 60 with a 3 ring, so a 66 box, set 14 past the photo's
// right and bottom edges. Its ring is drawn about 4 inside the box, so 7 shows below the photo:
// the photo column reserves that 7 (127 in all), and the 12 padding then reads the same top and
// bottom. The donut's center sits 19 above the photo's bottom edge, at 101. The text column is
// at least 127 tall with the macro rows (3 x 20) at its foot, pulled down 4 so the middle row,
// Fat, centers at 101 too.
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
    spiceLevel,
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
      className='group flex h-full items-start gap-4.5 rounded-xl bg-surface p-3 transition-colors hover:bg-surface/80 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none'
    >
      <div className='relative w-35 shrink-0 pb-1.75'>
        <div className='overflow-hidden rounded-lg'>
          <RecipeImage
            imageUrl={imageUrl}
            title={title}
            sizes={THUMB_SIZES}
            priority={false}
            rounded={false}
            aspect='aspect-[7/6]'
            zoomOnHover
            thumbnail
          />
        </div>
        <div
          className={`absolute -right-3.5 -bottom-1.75 rounded-full bg-surface p-0.75 transition-colors ${RING_HOVER}`}
        >
          <MacroDonut
            calories={calories}
            carbsG={carbsG}
            fatG={fatG}
            proteinG={proteinG}
            size={60}
          />
        </div>
      </div>
      <div className='flex min-h-31.75 min-w-0 flex-1 flex-col gap-1'>
        <h3 className='line-clamp-2 text-base leading-snug font-semibold text-text group-hover:text-primary'>
          {title}
        </h3>
        {!build.isDefault && (
          <p className='truncate text-xs font-medium text-primary'>
            Build: {build.label}
          </p>
        )}
        <div className='flex flex-wrap items-center gap-x-2 text-xs text-text-muted'>
          <span>
            {[
              courseLabel,
              usedInCount > 0 &&
                `Used in ${usedInCount} ${usedInCount === 1 ? 'recipe' : 'recipes'}`,
            ]
              .filter(Boolean)
              .join(' · ')}
          </span>
          {spiceLevel !== undefined && <SpiceLevel level={spiceLevel} />}
        </div>
        <ul className='mt-auto -mb-1 grid grid-cols-[auto_auto] justify-start gap-x-2.5 text-sm whitespace-nowrap text-text-muted tabular-nums'>
          {macros.map(({ tone, label, grams, percent }) => (
            <li key={tone} className='col-span-2 grid h-5 grid-cols-subgrid items-center'>
              <span className='flex items-center gap-2'>
                <span
                  aria-hidden='true'
                  className={`size-2 shrink-0 rounded-full ${DOTS[tone]}`}
                />
                <span className='font-semibold text-text'>{grams}g</span>
              </span>
              <span>
                {label} {percent}%
              </span>
            </li>
          ))}
        </ul>
      </div>
    </Link>
  )
}
