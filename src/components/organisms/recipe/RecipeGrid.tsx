import type { ReactElement } from 'react'

import { Fragment } from 'react'

import type { Fit, RecipeCard as RecipeCardData } from '@/libs/recipes'

import { RecipeCard } from './RecipeCard'

type RecipeGridProps = {
  recipes: RecipeCardData[]
  // How each recipe fits the active goal or targets, by slug
  fits?: Record<string, Fit>
  // Labels the good fits and the rest. Only used when the fits come first, as they do under Best match.
  showDividers?: boolean
  // True when the list may be empty because of filters, not because there are no recipes
  isFiltered?: boolean
}

const Divider = ({ children }: { children: string }): ReactElement => (
  <li className='col-span-full mt-1 border-b border-text-muted/20 pb-2 first:mt-0'>
    <h2 className='text-sm font-medium text-text-muted'>{children}</h2>
  </li>
)

export const RecipeGrid = ({
  recipes,
  fits,
  showDividers = false,
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

  const fitCount = recipes.filter(({ slug }) => fits?.[slug]?.isFit).length
  // The divider goes between two groups, so it needs both, with every fit ahead of the rest
  const hasGroups =
    showDividers &&
    fitCount > 0 &&
    fitCount < recipes.length &&
    recipes.slice(0, fitCount).every(({ slug }) => fits?.[slug]?.isFit)

  return (
    <ul className='grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3'>
      {recipes.map((recipe, index) => (
        <Fragment key={recipe.slug}>
          {hasGroups && index === 0 && (
            <Divider>
              {`${fitCount} close ${fitCount === 1 ? 'match' : 'matches'}`}
            </Divider>
          )}
          {hasGroups && index === fitCount && <Divider>Other recipes</Divider>}
          <li>
            <RecipeCard recipe={recipe} fit={fits?.[recipe.slug]} />
          </li>
        </Fragment>
      ))}
    </ul>
  )
}
