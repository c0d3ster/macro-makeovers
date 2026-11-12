'use client'

import type { ReactElement } from 'react'

import { useState } from 'react'

import type { RecipeIngredient } from '@/libs/recipes/ingredients'
import type { RecipeComponent } from '@/libs/recipes/recipeDetail'

import { Markdown } from '@/components/atoms'
import { AddToBasketButton } from '@/components/molecules/basket'
import {
  ComponentDisclosure,
  ServingsStepper,
} from '@/components/molecules/recipe'
import { groupIngredients, scaleIngredient } from '@/libs/recipes/ingredients'

type ScalableIngredientsProps = {
  ingredients: RecipeIngredient[]
  // Sides and sauces the dish uses, shown after its own lines and scaled with them
  components?: RecipeComponent[]
  baseServings: number
  // Adds the recipe to the basket at the servings shown here
  basket?: { slug: string; title: string; build?: string }
}

export const ScalableIngredients = ({
  ingredients,
  components = [],
  baseServings,
  basket,
}: ScalableIngredientsProps): ReactElement => {
  const [servings, setServings] = useState<number>(baseServings)
  const factor = servings / baseServings

  return (
    <>
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
              {lines.map((line) => (
                <li
                  key={line.raw}
                  className='flex items-start justify-between gap-3 px-4 py-2.5 text-sm text-text'
                >
                  <div className='min-w-0'>
                    <Markdown>{scaleIngredient(line.raw, factor)}</Markdown>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ))}
        {/* One component can be listed twice for different builds, so its scope is in the key */}
        {components.map((component) => (
          <ComponentDisclosure
            key={[
              component.slug,
              ...(component.onlyBuilds ?? []),
              ...(component.skipBuilds ?? []).map((key) => `-${key}`),
            ].join(':')}
            component={component}
            factor={factor}
            marked={markScoped && isScoped(component)}
          />
        ))}
      </div>
    </section>
      {basket && (
        <div className='mt-4'>
          <AddToBasketButton {...basket} servings={servings} />
        </div>
      )}
    </>
  )
}
