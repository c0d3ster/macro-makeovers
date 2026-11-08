import type { Metadata } from 'next'
import type { ReactElement } from 'react'

import { notFound } from 'next/navigation'

import { OwnerEditLink } from '@/components/molecules'
import { RecipePageContent } from '@/components/organisms'
import { LandingPageTemplate } from '@/components/templates'
import { logger } from '@/libs/Logger'
import { toMetaDescription } from '@/libs/recipes'

import { loadRecipe, loadRecipeSlugs } from './loadRecipe'

type RecipePageProps = {
  params: Promise<{ slug: string }>
}

// Public data, so each page is cached and refreshed at most once a minute
export const revalidate = 60

// Build the known recipes ahead of time. Slugs added later render on first visit, and a
// failed lookup here just means every page renders on demand instead of failing the build.
export const generateStaticParams = async (): Promise<{ slug: string }[]> => {
  try {
    const slugs = await loadRecipeSlugs()
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
    <LandingPageTemplate activeItem='recipes'>
      <RecipePageContent
        recipe={recipe}
        corner={<OwnerEditLink recipeId={recipe.id} />}
      />
    </LandingPageTemplate>
  )
}

export default RecipePage
