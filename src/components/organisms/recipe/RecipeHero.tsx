import type { ReactElement, ReactNode } from 'react'

import Link from 'next/link'

import type { RecipeDetail, RecipeView } from '@/libs/recipes'

import {
  BackLink,
  Badge,
  CostTier,
  CountUp,
  DifficultyDots,
  RecipeImage,
} from '@/components/atoms'
import { RecipeMacroSummary } from '@/components/molecules'
import { isSideCourse, SIDES_SECTION_ID, toTagPath } from '@/libs/recipes'
import { formatMinutes } from '@/utils/formatMinutes'

import {
  RECIPE_HERO_BODY,
  RECIPE_HERO_FACTS,
  RECIPE_HERO_GRID,
  RECIPE_HERO_PHOTO,
  RECIPE_HERO_TITLE,
} from './recipeLayout'
import { UsedInRecipes } from './UsedInRecipes'

type RecipeHeroProps = {
  recipe: RecipeDetail
  // The build being shown, which sets the title, facts, macros, tags, and photo
  view: RecipeView
  // Sits at the right end of the back link row, such as the owner's edit link
  corner?: ReactNode
}

export const RecipeHero = ({
  recipe,
  view,
  corner,
}: RecipeHeroProps): ReactElement => {
  const {
    servings,
    servingSize,
    makes,
    comparisons,
    baseRecipe,
    variants,
    usedIn,
  } = recipe
  const {
    title,
    summary,
    imageUrl,
    totalMinutes,
    costTier,
    difficulty,
    tags,
    course,
    build,
  } = view
  const original = comparisons[0]

  return (
    <header className='flex flex-col gap-5'>
      {/* The corner is centered on the link's line and out of the flow, so it appearing late
          never moves the page */}
      <div className='relative flex items-center'>
        {isSideCourse(course) ? (
          <BackLink href={`/recipes#${SIDES_SECTION_ID}`}>
            Sides and sauces
          </BackLink>
        ) : (
          <BackLink href='/recipes'>All recipes</BackLink>
        )}
        {corner && (
          <div className='absolute top-1/2 right-0 -translate-y-1/2'>
            {corner}
          </div>
        )}
      </div>

      <div className={RECIPE_HERO_GRID}>
        <h1 className={`text-4xl font-bold text-text ${RECIPE_HERO_TITLE}`}>
          {title}
        </h1>
        <dl className={RECIPE_HERO_FACTS}>
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

        <div className={RECIPE_HERO_BODY}>
          <p className='max-w-3xl text-text-muted'>{summary}</p>

          <div className='flex max-w-xl flex-col gap-3'>
            <div className='flex flex-wrap items-baseline justify-between gap-x-8 gap-y-1'>
              <p className='flex items-baseline gap-2'>
                <CountUp
                  value={build.calories}
                  className='text-4xl leading-none font-semibold'
                />
                <span className='text-base text-text-muted'>
                  cals per {servingSize ?? 'serving'}
                </span>
              </p>
              <p className='flex items-baseline gap-2'>
                <CountUp
                  value={servings}
                  className='text-2xl leading-none font-semibold'
                />
                <span className='text-base text-text-muted'>
                  servings{makes && ` · ${makes}`}
                </span>
              </p>
            </div>
            <RecipeMacroSummary reveal featured={build} original={original} />
          </div>

          <UsedInRecipes recipes={usedIn} />

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
                  <Link
                    href={toTagPath(tag)}
                    className='rounded-full focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none'
                  >
                    <Badge>{tag}</Badge>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className={RECIPE_HERO_PHOTO}>
          <RecipeImage imageUrl={imageUrl} title={title} />
        </div>
      </div>
    </header>
  )
}
