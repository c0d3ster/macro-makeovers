import type { ReactElement } from 'react'

import type { RecipeCard as RecipeCardData } from '@/libs/recipes'

import { RecipeCard } from './RecipeCard'

type RecipeGridProps = {
  recipes: RecipeCardData[]
}

export const RecipeGrid = ({ recipes }: RecipeGridProps): ReactElement => {
  if (recipes.length === 0) {
    return (
      <p className='rounded-xl bg-surface p-8 text-center text-text-muted'>
        No recipes yet. Check back soon.
      </p>
    )
  }

  return (
    <ul className='grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3'>
      {recipes.map((recipe) => (
        <li key={recipe.slug}>
          <RecipeCard recipe={recipe} />
        </li>
      ))}
    </ul>
  )
}
