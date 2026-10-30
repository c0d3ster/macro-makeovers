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
        <NutritionTable
          builds={recipe.nutrition}
          servings={recipe.servings}
          featured={recipe.featured}
          intro={recipe.nutritionIntro}
          analysis={recipe.nutritionAnalysis}
        />
        <div className='grid gap-10 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] lg:gap-14'>
          <ScalableIngredients
            ingredients={recipe.ingredients}
            baseServings={recipe.servings}
          />
          <StepList
            steps={recipe.steps}
            prepMinutes={recipe.prepMinutes}
            cookMinutes={recipe.cookMinutes}
          />
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
