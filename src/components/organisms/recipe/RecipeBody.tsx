import type { ReactElement, ReactNode } from 'react'

import type { RecipeDetail, RecipeView } from '@/libs/recipes'

import { NutritionTable } from './NutritionTable'
import { RecipeHero } from './RecipeHero'
import {
  RECIPE_BODY_GRID,
  RECIPE_BODY_INGREDIENTS,
  RECIPE_BODY_NUTRITION,
  RECIPE_BODY_STEPS,
  RECIPE_PAGE_LAYOUT,
} from './recipeLayout'
import { RecipeNotes } from './RecipeNotes'
import { ScalableIngredients } from './ScalableIngredients'
import { StepList } from './StepList'

type RecipeBodyProps = {
  recipe: RecipeDetail
  // The build being shown
  view: RecipeView
  onSelectBuild?: (key: string) => void
  corner?: ReactNode
}

// The recipe page for one build. Rendered on the server for the default build, and by the
// build switcher once the URL is known.
export const RecipeBody = ({
  recipe,
  view,
  onSelectBuild,
  corner,
}: RecipeBodyProps): ReactElement => {
  const markScoped = recipe.builds.length > 1

  return (
    <main className={RECIPE_PAGE_LAYOUT}>
      <RecipeHero recipe={recipe} view={view} corner={corner} />
      {/* Ingredients stay level with nutrition and sticky while the steps scroll, with the
          basket button under them. The right column is the home for later extras (favorite,
          reviews). */}
      <div className={RECIPE_BODY_GRID}>
        <div className={RECIPE_BODY_NUTRITION}>
          <NutritionTable
            builds={recipe.builds}
            comparisons={recipe.comparisons}
            servings={recipe.servings}
            selected={view.build}
            onSelect={onSelectBuild}
            intro={view.nutritionIntro}
            analysis={view.nutritionAnalysis}
          />
        </div>
        <div className={`md:sticky md:top-24 ${RECIPE_BODY_INGREDIENTS}`}>
          <ScalableIngredients
            ingredients={view.ingredients}
            components={view.components}
            baseServings={recipe.servings}
            markScoped={markScoped}
            basket={{
              slug: recipe.slug,
              title: view.title,
              build: view.build.isDefault ? undefined : view.build.key,
            }}
          />
        </div>
        <div className={RECIPE_BODY_STEPS}>
          <StepList
            steps={view.steps}
            prepMinutes={view.prepMinutes}
            cookMinutes={view.cookMinutes}
            markScoped={markScoped}
          />
        </div>
      </div>
      <RecipeNotes notes={view.notes} />
    </main>
  )
}
