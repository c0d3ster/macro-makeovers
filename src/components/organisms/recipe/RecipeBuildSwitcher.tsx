'use client'

import type { ReactElement, ReactNode } from 'react'

import { useSearchParams } from 'next/navigation'
import { useCallback, useMemo } from 'react'

import type { RecipeDetail } from '@/libs/recipes'

import { findBuild } from '@/libs/recipes/recipeBuilds'
import { toRecipeView } from '@/libs/recipes/recipeDetail'

import { RecipeBody } from './RecipeBody'

type RecipeBuildSwitcherProps = {
  recipe: RecipeDetail
  corner?: ReactNode
}

const BUILD_PARAM = 'build'

// Shows the build named in ?build= and switches builds in place. The URL is replaced, not
// pushed, so Back still leaves the page, and the default build keeps the canonical URL.
export const RecipeBuildSwitcher = ({
  recipe,
  corner,
}: RecipeBuildSwitcherProps): ReactElement => {
  const params = useSearchParams()
  const key = params.get(BUILD_PARAM)
  const view = useMemo(() => toRecipeView(recipe, key), [recipe, key])

  const selectBuild = useCallback(
    (next: string): void => {
      const build = findBuild(recipe.builds, next)
      const url = new URL(window.location.href)
      if (!build || build.isDefault) url.searchParams.delete(BUILD_PARAM)
      else url.searchParams.set(BUILD_PARAM, build.key)
      window.history.replaceState(null, '', url)
    },
    [recipe.builds]
  )

  return (
    <RecipeBody
      recipe={recipe}
      view={view}
      onSelectBuild={selectBuild}
      corner={corner}
    />
  )
}
