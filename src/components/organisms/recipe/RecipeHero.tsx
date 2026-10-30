import type { ReactElement } from 'react'

import Link from 'next/link'

import type { RecipeDetail } from '@/libs/recipes'

import { Badge, CostTier, DifficultyDots, MacroPill } from '@/components/atoms'
import { toMacroRatios } from '@/libs/recipes'
import { formatMinutes } from '@/utils/formatMinutes'

type RecipeHeroProps = {
  recipe: RecipeDetail
}

export const RecipeHero = ({ recipe }: RecipeHeroProps): ReactElement => {
  const {
    title,
    summary,
    servings,
    prepMinutes,
    cookMinutes,
    totalMinutes,
    costTier,
    difficulty,
    tags,
    featured,
    baseRecipe,
    variants,
  } = recipe
  const { proteinPct, carbsPct, fatPct } = toMacroRatios(featured)

  return (
    <header className='flex flex-col gap-5'>
      <Link
        href='/'
        className='w-fit text-sm text-text-muted hover:text-primary'
      >
        &larr; All recipes
      </Link>

      <h1 className='text-4xl font-bold text-text'>{title}</h1>
      <p className='max-w-3xl text-text-muted'>{summary}</p>

      <div className='flex max-w-md flex-col gap-2'>
        <p className='flex items-baseline gap-1.5'>
          <span className='text-3xl leading-none font-semibold text-text'>
            {featured.calories}
          </span>
          <span className='text-sm text-text-muted'>cal per serving</span>
        </p>
        <div className='grid grid-cols-3 gap-2'>
          <MacroPill label='Carbs' percent={carbsPct} grams={featured.carbsG} />
          <MacroPill label='Fat' percent={fatPct} grams={featured.fatG} />
          <MacroPill
            label='Protein'
            percent={proteinPct}
            grams={featured.proteinG}
          />
        </div>
      </div>

      <dl className='flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-text-muted'>
        <div className='flex gap-1.5'>
          <dt>Prep</dt>
          <dd className='text-text'>{formatMinutes(prepMinutes)}</dd>
        </div>
        <div className='flex gap-1.5'>
          <dt>Cook</dt>
          <dd className='text-text'>{formatMinutes(cookMinutes)}</dd>
        </div>
        <div className='flex gap-1.5'>
          <dt>Total</dt>
          <dd className='text-text'>{formatMinutes(totalMinutes)}</dd>
        </div>
        <div className='flex gap-1.5'>
          <dt>Makes</dt>
          <dd className='text-text'>{servings} servings</dd>
        </div>
        <div className='flex items-center gap-1.5'>
          <dt>Cost</dt>
          <dd>
            <CostTier tier={costTier} />
          </dd>
        </div>
        <div className='flex items-center gap-1.5'>
          <dt>Difficulty</dt>
          <dd>
            <DifficultyDots level={difficulty} />
          </dd>
        </div>
      </dl>

      {tags.length > 0 && (
        <ul className='flex flex-wrap gap-1.5'>
          {tags.map((tag) => (
            <li key={tag}>
              <Badge>{tag}</Badge>
            </li>
          ))}
        </ul>
      )}

      {(baseRecipe || variants.length > 0) && (
        <p className='text-sm text-text-muted'>
          {baseRecipe && (
            <>
              A variation of{' '}
              <Link
                href={`/recipes/${baseRecipe.slug}`}
                className='text-primary underline hover:no-underline'
              >
                {baseRecipe.title}
              </Link>
              .
            </>
          )}
          {variants.length > 0 && (
            <>
              Variations:{' '}
              {variants.map(({ slug, title: variantTitle }, index) => (
                <span key={slug}>
                  {index > 0 && ', '}
                  <Link
                    href={`/recipes/${slug}`}
                    className='text-primary underline hover:no-underline'
                  >
                    {variantTitle}
                  </Link>
                </span>
              ))}
              .
            </>
          )}
        </p>
      )}
    </header>
  )
}
