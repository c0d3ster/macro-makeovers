import type { ReactElement } from 'react'

import type { RecipeCard } from '@/libs/recipes'

import { CompactRecipeCard } from './CompactRecipeCard'

type CompactRecipeGridProps = {
  recipes: RecipeCard[]
}

// Sides and sauces as compact cards, up to three to a row, the same columns as the main grid
export const CompactRecipeGrid = ({
  recipes,
}: CompactRecipeGridProps): ReactElement => (
  <ul className='grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3'>
    {recipes.map((recipe) => (
      <li key={`${recipe.slug}:${recipe.build.key}`}>
        <CompactRecipeCard recipe={recipe} />
      </li>
    ))}
  </ul>
)
