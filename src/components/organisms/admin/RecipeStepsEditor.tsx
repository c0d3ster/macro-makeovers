'use client'

import type { ReactElement } from 'react'

import { useFieldArray, useWatch } from 'react-hook-form'

import type { RecipeImportInput } from '@/validations'

import {
  AddRowButton,
  InlineInput,
  InlineSelect,
  InlineTextarea,
  RemoveRowButton,
} from '@/components/molecules'

import { numberField, useRecipeForm } from './recipeFormFields'

type Phase = RecipeImportInput['steps'][number]['phase']

const PHASES: {
  phase: Phase
  title: string
  minutesField: 'prepMinutes' | 'cookMinutes'
}[] = [
  { phase: 'prep', title: 'Prep', minutesField: 'prepMinutes' },
  { phase: 'cook', title: 'Cook', minutesField: 'cookMinutes' },
]

// The page's steps with their text as fields. Numbering runs straight through prep into cook,
// and both phases always show so a step can be added to an empty one.
export const RecipeStepsEditor = (): ReactElement => {
  const {
    control,
    register,
    formState: { errors },
  } = useRecipeForm()
  const steps = useFieldArray({ control, name: 'steps' })
  const rows = useWatch({ control, name: 'steps' })
  const listMessage = errors.steps?.root?.message ?? errors.steps?.message

  const stepsOf = (phase: Phase): { id: string; index: number }[] =>
    steps.fields.flatMap(({ id, phase: initial }, index) =>
      (rows[index]?.phase ?? initial) === phase ? [{ id, index }] : []
    )

  // A new step goes at the end of its phase. Prep with no steps yet still comes before cook.
  const addStep = (phase: Phase): void => {
    const last = stepsOf(phase).at(-1)
    const at = last
      ? last.index + 1
      : phase === 'prep'
        ? 0
        : steps.fields.length
    steps.insert(at, { phase, body: '' })
  }

  let number = 0

  return (
    <section aria-labelledby='steps-heading' className='flex flex-col gap-6'>
      <h2 id='steps-heading' className='text-2xl font-semibold text-text'>
        Steps
      </h2>

      {listMessage && (
        <p role='alert' className='text-sm text-red-400'>
          {listMessage}
        </p>
      )}

      {PHASES.map(({ phase, title, minutesField }) => (
        <div key={phase} className='flex flex-col gap-3'>
          <h3 className='flex items-center gap-2 text-sm font-semibold tracking-wide text-accent uppercase'>
            {title}
            <span className='flex items-center gap-1 font-normal tracking-normal text-text-muted normal-case'>
              ~
              <InlineInput
                label={`${title} minutes`}
                type='number'
                error={errors[minutesField]?.message}
                fieldClassName='w-14'
                {...numberField(register, minutesField)}
              />
              min
            </span>
          </h3>
          <ol className='flex flex-col gap-4'>
            {stepsOf(phase).map(({ id, index }) => {
              number += 1
              return (
                <li key={id} className='flex gap-4'>
                  <span
                    aria-hidden='true'
                    className='flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-on-primary'
                  >
                    {number}
                  </span>
                  <div className='flex min-w-0 flex-1 flex-col gap-2'>
                    <InlineTextarea
                      label={`Step ${index + 1}`}
                      error={errors.steps?.[index]?.body?.message}
                      rows={3}
                      placeholder='What to do. Markdown is fine here.'
                      className='text-text-muted'
                      {...register(`steps.${index}.body`)}
                    />
                    <div className='flex flex-wrap items-center gap-2 text-xs text-text-muted'>
                      About
                      <InlineInput
                        label={`Step ${index + 1} minutes`}
                        type='number'
                        step='any'
                        error={errors.steps?.[index]?.durationMinutes?.message}
                        fieldClassName='w-14'
                        placeholder='-'
                        {...numberField(
                          register,
                          `steps.${index}.durationMinutes`
                        )}
                      />
                      min
                      <InlineSelect
                        label={`Step ${index + 1} phase`}
                        fieldClassName='ml-auto w-fit'
                        {...register(`steps.${index}.phase`)}
                      >
                        <option value='prep'>Prep</option>
                        <option value='cook'>Cook</option>
                      </InlineSelect>
                      <RemoveRowButton
                        label={`Remove step ${index + 1}`}
                        onClick={() => steps.remove(index)}
                      />
                    </div>
                  </div>
                </li>
              )
            })}
          </ol>
          <AddRowButton onClick={() => addStep(phase)}>
            Add {title.toLowerCase()} step
          </AddRowButton>
        </div>
      ))}
    </section>
  )
}
