import type { ReactElement } from 'react'

import Link from 'next/link'

import type { RelatedRecipe } from '@/libs/recipes'

type UsedInRecipesProps = {
  recipes: RelatedRecipe[]
}

// On a side or sauce, under the macros: the published dishes that use it
export const UsedInRecipes = ({
  recipes,
}: UsedInRecipesProps): ReactElement | null => {
  if (recipes.length === 0) return null

  return (
    <div className='flex flex-wrap items-center gap-2 text-sm text-text-muted'>
      <span>Used in</span>
      <ul className='contents'>
        {recipes.map(({ slug, title }) => (
          <li key={slug}>
            <Link
              href={`/recipes/${slug}`}
              className='inline-flex rounded-full border border-primary/40 px-3 py-1 text-text transition-colors hover:border-primary hover:text-primary focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none'
            >
              {title}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
