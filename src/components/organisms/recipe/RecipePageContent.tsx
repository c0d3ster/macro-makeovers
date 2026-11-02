import type { ReactElement, ReactNode } from 'react'

import type { RecipeDetail } from '@/libs/recipes'

import { NutritionTable } from './NutritionTable'
import { RecipeHero } from './RecipeHero'
import { RecipeNotes } from './RecipeNotes'
import { ScalableIngredients } from './ScalableIngredients'
import { StepList } from './StepList'

type RecipePageContentProps = {
  recipe: RecipeDetail
  // Sits in the top corner of the page, such as the owner's edit link
  corner?: ReactNode
}

// The body of a recipe page, shared by the public page and the owner's preview of a draft
export const RecipePageContent = ({
  recipe,
  corner,
}: RecipePageContentProps): ReactElement => (
  <main className='relative mx-auto flex max-w-6xl flex-col gap-12 px-3 py-10 sm:px-6 lg:px-8'>
    {corner}
    <RecipeHero recipe={recipe} />
    {/* Nutrition and steps share the left column. Ingredients sit on the right, level with
        nutrition and sticky while the steps scroll. On a phone they stack in cooking order:
        nutrition, ingredients, steps. The right column is the home for later extras
        (favorite, shopping list, reviews). */}
    <div className='grid grid-cols-1 gap-y-12 md:grid-cols-[minmax(0,1fr)_18rem] md:gap-x-6 lg:grid-cols-[minmax(0,1fr)_24rem] lg:gap-x-10'>
      <div className='md:col-start-1 md:row-start-1'>
        <NutritionTable
          builds={recipe.nutrition}
          servings={recipe.servings}
          featured={recipe.featured}
          intro={recipe.nutritionIntro}
          analysis={recipe.nutritionAnalysis}
        />
      </div>
      <div className='md:sticky md:top-24 md:col-start-2 md:row-span-2 md:row-start-1 md:self-start'>
        <ScalableIngredients
          ingredients={recipe.ingredients}
          baseServings={recipe.servings}
        />
      </div>
      <div className='md:col-start-1 md:row-start-2'>
        <StepList
          steps={recipe.steps}
          prepMinutes={recipe.prepMinutes}
          cookMinutes={recipe.cookMinutes}
        />
      </div>
    </div>
    <RecipeNotes notes={recipe.notes} />

    <p className='text-xs text-text-muted'>
      Nutrition numbers are estimates tracked in MyFitnessPal. Your brands and
      portions will shift them a little.
    </p>
  </main>
)
