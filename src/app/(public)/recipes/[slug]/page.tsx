import type { Metadata } from 'next'
import type { ReactElement } from 'react'

import { notFound } from 'next/navigation'

import {
  NutritionTable,
  RecipeHero,
  RecipeNotes,
  ScalableIngredients,
  StepList,
} from '@/components/organisms'
import { LandingPageTemplate } from '@/components/templates'
import { logger } from '@/libs/Logger'
import { listRecipeSlugs, toMetaDescription } from '@/libs/recipes'
import { createPublicClient } from '@/libs/supabase/public'

import { loadRecipe } from './loadRecipe'

type RecipePageProps = {
  params: Promise<{ slug: string }>
}

// Public data, so each page is cached and refreshed at most once a minute
export const revalidate = 60

// Build the known recipes ahead of time. Slugs added later render on first visit, and a
// failed lookup here just means every page renders on demand instead of failing the build.
export const generateStaticParams = async (): Promise<{ slug: string }[]> => {
  try {
    const slugs = await listRecipeSlugs(createPublicClient())
    return slugs.map((slug) => ({ slug }))
  } catch (error) {
    logger.error('Could not list recipes to prebuild', { error })
    return []
  }
}

export const generateMetadata = async ({
  params,
}: RecipePageProps): Promise<Metadata> => {
  const { slug } = await params
  const recipe = await loadRecipe(slug)
  if (!recipe) return {}

  const description = toMetaDescription(recipe.summary)
  return {
    title: recipe.title,
    description,
    alternates: { canonical: `/recipes/${slug}` },
    openGraph: { title: recipe.title, description, type: 'article' },
  }
}

const RecipePage = async ({
  params,
}: RecipePageProps): Promise<ReactElement> => {
  const { slug } = await params
  const recipe = await loadRecipe(slug)
  if (!recipe) notFound()

  return (
    <LandingPageTemplate>
      <main className='mx-auto flex max-w-6xl flex-col gap-12 px-4 py-10 sm:px-6 lg:px-8'>
        <RecipeHero recipe={recipe} />
        {/* Nutrition and steps share the left column. Ingredients sit on the right, level with
            nutrition and sticky while the steps scroll. On a phone they stack in cooking order:
            nutrition, ingredients, steps. The right column is the home for later extras
            (favorite, shopping list, reviews). */}
        <div className='grid gap-x-10 gap-y-12 lg:grid-cols-[minmax(0,1fr)_24rem]'>
          <div className='lg:col-start-1 lg:row-start-1'>
            <NutritionTable
              builds={recipe.nutrition}
              servings={recipe.servings}
              featured={recipe.featured}
              intro={recipe.nutritionIntro}
              analysis={recipe.nutritionAnalysis}
            />
          </div>
          <div className='lg:sticky lg:top-24 lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:self-start'>
            <ScalableIngredients
              ingredients={recipe.ingredients}
              baseServings={recipe.servings}
            />
          </div>
          <div className='lg:col-start-1 lg:row-start-2'>
            <StepList
              steps={recipe.steps}
              prepMinutes={recipe.prepMinutes}
              cookMinutes={recipe.cookMinutes}
            />
          </div>
        </div>
        <RecipeNotes notes={recipe.notes} />

        <p className='text-xs text-text-muted'>
          Nutrition numbers are estimates tracked in MyFitnessPal. Your brands
          and portions will shift them a little.
        </p>
      </main>
    </LandingPageTemplate>
  )
}

export default RecipePage
