import type { ReactElement, ReactNode } from 'react'

import type { RecipeDetail } from '@/libs/recipes'

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

type RecipePageContentProps = {
  recipe: RecipeDetail
  // Sits beside the back link at the top of the page, such as the owner's edit link
  corner?: ReactNode
}

// The body of a recipe page, shared by the public page and the owner's preview of a draft
export const RecipePageContent = ({
  recipe,
  corner,
}: RecipePageContentProps): ReactElement => (
  <main className={RECIPE_PAGE_LAYOUT}>
    <RecipeHero recipe={recipe} corner={corner} />
    {/* Ingredients stay level with nutrition and sticky while the steps scroll. The right
        column is the home for later extras (favorite, shopping list, reviews). */}
    <div className={RECIPE_BODY_GRID}>
      <div className={RECIPE_BODY_NUTRITION}>
        <NutritionTable
          builds={recipe.nutrition}
          servings={recipe.servings}
          featured={recipe.featured}
          intro={recipe.nutritionIntro}
          analysis={recipe.nutritionAnalysis}
        />
      </div>
      <div className={`md:sticky md:top-24 ${RECIPE_BODY_INGREDIENTS}`}>
        <ScalableIngredients
          ingredients={recipe.ingredients}
          baseServings={recipe.servings}
        />
      </div>
      <div className={RECIPE_BODY_STEPS}>
        <StepList
          steps={recipe.steps}
          prepMinutes={recipe.prepMinutes}
          cookMinutes={recipe.cookMinutes}
        />
      </div>
    </div>
    <RecipeNotes notes={recipe.notes} />
  </main>
)
