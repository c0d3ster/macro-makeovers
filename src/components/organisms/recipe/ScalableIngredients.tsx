'use client'

import type { ReactElement } from 'react'

import { useState } from 'react'

import type { RecipeIngredient } from '@/libs/recipes/ingredients'

import { Markdown } from '@/components/atoms'
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
      className='flex flex-col rounded-xl bg-surface py-4'
    >
      <div className='flex flex-wrap items-center justify-between gap-3 px-4 pb-3'>
        <h2
          id='ingredients-heading'
          className='text-xl font-semibold text-text'
        >
          Ingredients
        </h2>
        <ServingsStepper servings={servings} onChange={setServings} />
      </div>

      {servings !== baseServings && (
        <p className='px-4 pb-3 text-sm text-text-muted'>
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

      <div className='flex flex-col divide-y divide-text-muted/30 border-t border-text-muted/30'>
        {groupIngredients(ingredients).map(({ name, ingredients: lines }) => (
          <div key={name ?? 'ungrouped'}>
            {name && (
              <h3 className='px-4 py-2.5 text-xs font-semibold tracking-wide text-primary uppercase'>
                {name}
              </h3>
            )}
            <ul
              className={`flex flex-col divide-y divide-text-muted/30 ${name ? 'border-t border-text-muted/30' : ''}`}
            >
              {lines.map(({ raw }) => (
                <li key={raw} className='px-4 py-2.5 text-sm text-text'>
                  <Markdown>{scaleIngredient(raw, factor)}</Markdown>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  )
}
