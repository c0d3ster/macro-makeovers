'use client'

import type { ReactElement } from 'react'

import { useFieldArray } from 'react-hook-form'

import {
  AddRowButton,
  InlineInput,
  RemoveRowButton,
} from '@/components/molecules'
import { RECIPE_COURSES } from '@/libs/recipes/recipeCourses'

import { BuildScopePicker } from './BuildScopePicker'
import { numberField, optionalText, useRecipeForm } from './recipeFormFields'

const COURSE_LABELS: Record<(typeof RECIPE_COURSES)[number], string> = {
  breakfast: 'Breakfast',
  appetizer: 'Appetizer',
  main: 'Main',
  side: 'Side',
  sauce: 'Sauce',
}

const SELECT =
  'rounded-md border border-text-muted/30 bg-surface px-2 py-1 text-sm text-text focus-visible:border-primary focus-visible:ring-1 focus-visible:ring-primary focus-visible:outline-none'

// What the dish is on a menu, and the sides and sauces it uses. A component is another saved
// recipe, named by slug, and shows inline in this recipe's ingredients.
export const RecipeComponentsEditor = (): ReactElement => {
  const {
    control,
    register,
    formState: { errors },
  } = useRecipeForm()
  const components = useFieldArray({ control, name: 'components' })

  return (
    <section
      aria-labelledby='components-heading'
      className='flex flex-col gap-4 rounded-xl bg-surface p-4'
    >
      <div className='flex flex-wrap items-center justify-between gap-3'>
        <h2 id='components-heading' className='text-xl font-semibold text-text'>
          Course, serving size, and components
        </h2>
        <label className='flex items-center gap-2 text-sm text-text-muted'>
          Course
          <select {...register('course')} className={SELECT}>
            {RECIPE_COURSES.map((course) => (
              <option key={course} value={course}>
                {COURSE_LABELS[course]}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className='grid grid-cols-1 gap-3 text-sm sm:grid-cols-2'>
        <div className='flex flex-col gap-1 text-text-muted'>
          <span aria-hidden='true'>Serving size</span>
          <InlineInput
            label='Serving size'
            placeholder='1/2 cup'
            error={errors.servingSize?.message}
            className='text-text'
            {...register('servingSize', { setValueAs: optionalText })}
          />
        </div>
        <div className='flex flex-col gap-1 text-text-muted'>
          <span aria-hidden='true'>The batch makes</span>
          <InlineInput
            label='The batch makes'
            placeholder='2.5 cups'
            error={errors.makes?.message}
            className='text-text'
            {...register('makes', { setValueAs: optionalText })}
          />
        </div>
      </div>
      <p className='text-sm text-text-muted'>
        Both are optional. The page reads &quot;cals per 1/2 cup&quot; and &quot;5 servings ·
        2.5 cups&quot;. Sides and sauces show as compact cards in their own section. List the ones
        this recipe uses by slug, and they show inline in its ingredients.
      </p>

      {components.fields.length > 0 && (
        <ul className='flex flex-col divide-y divide-text-muted/30'>
          {components.fields.map(({ id }, index) => {
            const rowErrors = errors.components?.[index]
            return (
              <li
                key={id}
                className='group/editable flex items-start gap-3 py-2.5 text-sm text-text'
              >
                <div className='grid min-w-0 flex-1 grid-cols-1 gap-2 sm:grid-cols-[2fr_2fr_1fr_1fr]'>
                  <InlineInput
                    label={`Component ${index + 1} slug`}
                    placeholder='mango-habanero-salsa'
                    error={rowErrors?.slug?.message}
                    {...register(`components.${index}.slug`)}
                  />
                  <InlineInput
                    label={`Component ${index + 1} amount`}
                    placeholder='1/2 cup per bowl'
                    error={rowErrors?.amount?.message}
                    {...register(`components.${index}.amount`, {
                      setValueAs: optionalText,
                    })}
                  />
                  <InlineInput
                    type='number'
                    step='0.25'
                    min='0'
                    label={`Component ${index + 1} servings per serving`}
                    title='Component servings per serving of this recipe'
                    placeholder='1'
                    error={rowErrors?.servingsPerServing?.message}
                    {...numberField(register, `components.${index}.servingsPerServing`)}
                  />
                  <InlineInput
                    label={`Component ${index + 1} build`}
                    placeholder='Default build'
                    error={rowErrors?.build?.message}
                    {...register(`components.${index}.build`, {
                      setValueAs: optionalText,
                    })}
                  />
                  <div className='sm:col-span-4'>
                    <BuildScopePicker section='components' index={index} />
                  </div>
                </div>
                <RemoveRowButton
                  label={`Remove component ${index + 1}`}
                  onClick={() => components.remove(index)}
                />
              </li>
            )
          })}
        </ul>
      )}

      <AddRowButton
        onClick={() =>
          components.append({ slug: '', servingsPerServing: 1 }, { shouldFocus: true })
        }
      >
        Add a side or sauce
      </AddRowButton>
    </section>
  )
}
