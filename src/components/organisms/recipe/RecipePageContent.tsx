import type { ReactElement, ReactNode } from 'react'

import { Suspense } from 'react'

import type { RecipeDetail } from '@/libs/recipes'

import { toRecipeView } from '@/libs/recipes'

import { RecipeBody } from './RecipeBody'
import { RecipeBuildSwitcher } from './RecipeBuildSwitcher'

type RecipePageContentProps = {
  recipe: RecipeDetail
  // Sits beside the back link at the top of the page, such as the owner's edit link
  corner?: ReactNode
}

// The body of a recipe page, shared by the public page and the owner's preview of a draft.
// The page stays static: the server renders the default build, and with more than one build
// the switcher takes over once the URL's ?build= is known.
export const RecipePageContent = ({
  recipe,
  corner,
}: RecipePageContentProps): ReactElement => {
  const fallback = (
    <RecipeBody recipe={recipe} view={toRecipeView(recipe)} corner={corner} />
  )
  if (recipe.builds.length < 2) return fallback

  return (
    <Suspense fallback={fallback}>
      <RecipeBuildSwitcher recipe={recipe} corner={corner} />
    </Suspense>
  )
}
