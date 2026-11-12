import type { ReactElement } from 'react'

import Link from 'next/link'

import type { RelatedRecipe } from '@/libs/recipes'

type UsedInRecipesProps = {
  recipes: RelatedRecipe[]
}

// On a side or sauce: the published dishes that use it
export const UsedInRecipes = ({
  recipes,
}: UsedInRecipesProps): ReactElement | null => {
  if (recipes.length === 0) return null

  return (
    <section aria-labelledby='used-in-heading' className='flex flex-col gap-4'>
      <h2 id='used-in-heading' className='text-2xl font-semibold text-text'>
        Used in
      </h2>
      <ul className='flex flex-wrap gap-3'>
        {recipes.map(({ slug, title }) => (
          <li key={slug}>
            <Link
              href={`/recipes/${slug}`}
              className='inline-flex rounded-xl bg-surface px-4 py-3 text-text transition-colors hover:bg-surface/80 hover:text-primary'
            >
              {title}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
