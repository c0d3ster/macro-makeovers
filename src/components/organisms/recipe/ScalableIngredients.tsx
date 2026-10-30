'use client'

import type { ReactElement } from 'react'

import { useState } from 'react'

import type { RecipeIngredient } from '@/libs/recipes/ingredients'

import { ServingsStepper } from '@/components/molecules/recipe'
import { groupIngredients, scaleIngredient } from '@/libs/recipes/ingredients'

type ScalableIngredientsProps = {
  ingredients: RecipeIngredient[]
  baseServings: number
}

export const ScalableIngredients = ({
  ingredients,
  baseServings,
}: ScalableIngredientsProps): ReactElement => {
  const [servings, setServings] = useState<number>(baseServings)
  const factor = servings / baseServings

  return (
    <section
      aria-labelledby='ingredients-heading'
      className='flex flex-col gap-5'
    >
      <div className='flex flex-wrap items-center justify-between gap-3'>
        <h2
          id='ingredients-heading'
          className='text-2xl font-semibold text-text'
        >
          Ingredients
        </h2>
        <ServingsStepper servings={servings} onChange={setServings} />
      </div>

      {servings !== baseServings && (
        <p className='text-sm text-text-muted'>
          Scaled from {baseServings} servings. Amounts at the start of a line
          scale, so check any quantities written inside the text.{' '}
          <button
            type='button'
            className='text-primary underline hover:no-underline'
            onClick={() => setServings(baseServings)}
          >
            Reset
          </button>
        </p>
      )}

      {groupIngredients(ingredients).map(({ name, ingredients: lines }) => (
        <div key={name ?? 'ungrouped'}>
          {name && (
            <h3 className='mb-2 text-sm font-semibold tracking-wide text-accent uppercase'>
              {name}
            </h3>
          )}
          <ul className='flex flex-col divide-y divide-background rounded-xl bg-surface'>
            {lines.map(({ raw }) => (
              <li key={raw} className='px-4 py-2.5 text-text'>
                {scaleIngredient(raw, factor)}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </section>
  )
}
