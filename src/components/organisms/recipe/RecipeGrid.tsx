import type { ReactElement } from 'react'

import type { RecipeCard as RecipeCardData } from '@/libs/recipes'

import { RecipeCard } from './RecipeCard'

type RecipeGridProps = {
  recipes: RecipeCardData[]
  // True when the list may be empty because of filters, not because there are no recipes
  isFiltered?: boolean
}

export const RecipeGrid = ({
  recipes,
  isFiltered = false,
}: RecipeGridProps): ReactElement => {
  if (recipes.length === 0) {
    return (
      <p className='rounded-xl bg-surface p-8 text-center text-text-muted'>
        {isFiltered
          ? 'No recipes match those filters. Try loosening one.'
          : 'No recipes yet. Check back soon.'}
      </p>
    )
  }

  return (
    <ul className='grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3'>
      {recipes.map((recipe) => (
        <li key={recipe.slug}>
          <RecipeCard recipe={recipe} />
        </li>
      ))}
    </ul>
  )
}
