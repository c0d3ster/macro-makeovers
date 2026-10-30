import type { ReactElement } from 'react'

import Link from 'next/link'

import type { RecipeDetail } from '@/libs/recipes'

import {
  Badge,
  CostTier,
  DifficultyDots,
  RecipeImage,
} from '@/components/atoms'
import { MacroBar } from '@/components/molecules'
import { stripServingsNote, toMacroRatios } from '@/libs/recipes'
import { formatMinutes } from '@/utils/formatMinutes'

type RecipeHeroProps = {
  recipe: RecipeDetail
}

export const RecipeHero = ({ recipe }: RecipeHeroProps): ReactElement => {
  const {
    title,
    summary,
    servings,
    imageUrl,
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

      <div className='grid gap-x-10 gap-y-5 md:grid-cols-[minmax(0,1fr)_20rem] lg:grid-cols-[minmax(0,1fr)_24rem]'>
        <h1 className='text-4xl font-bold text-text md:col-start-1 md:row-start-1'>
          {title}
        </h1>
        <dl className='flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-text-muted md:col-start-2 md:row-start-1 md:justify-end'>
          <div className='flex items-center gap-2'>
            <dt>Total</dt>
            <dd className='text-text'>{formatMinutes(totalMinutes)}</dd>
          </div>
          <div className='flex items-center gap-2'>
            <dt>Cost</dt>
            <dd>
              <CostTier tier={costTier} />
            </dd>
          </div>
          <div className='flex items-center gap-2'>
            <dt>Difficulty</dt>
            <dd>
              <DifficultyDots level={difficulty} />
            </dd>
          </div>
        </dl>

        <div className='flex flex-col gap-5 md:col-start-1 md:row-start-2'>
          <p className='max-w-3xl text-text-muted'>
            {stripServingsNote(summary)}
          </p>

          <div className='flex max-w-xl flex-col gap-3'>
            <div className='flex flex-wrap items-baseline gap-x-8 gap-y-1'>
              <p className='flex items-baseline gap-2'>
                <span className='text-4xl leading-none font-semibold text-text'>
                  {featured.calories}
                </span>
                <span className='text-base text-text-muted'>
                  cal per serving
                </span>
              </p>
              <p className='flex items-baseline gap-2'>
                <span className='text-base text-text-muted'>Makes</span>
                <span className='text-2xl leading-none font-semibold text-text'>
                  {servings}
                </span>
                <span className='text-base text-text-muted'>servings</span>
              </p>
            </div>
            <MacroBar
              macros={[
                { label: 'Carbs', percent: carbsPct, grams: featured.carbsG },
                { label: 'Fat', percent: fatPct, grams: featured.fatG },
                {
                  label: 'Protein',
                  percent: proteinPct,
                  grams: featured.proteinG,
                },
              ]}
            />
          </div>

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

          {tags.length > 0 && (
            <ul className='flex flex-wrap gap-1.5 md:mt-auto'>
              {tags.map((tag) => (
                <li key={tag}>
                  <Badge>{tag}</Badge>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className='md:col-start-2 md:row-start-2'>
          <RecipeImage imageUrl={imageUrl} title={title} />
        </div>
      </div>
    </header>
  )
}
