'use client'

import type { ReactElement } from 'react'

import { useFieldArray, useWatch } from 'react-hook-form'

import type { RecipeImportInput } from '@/validations'

import {
  AddRowButton,
  InlineInput,
  MarkdownField,
  PlaceholderButton,
  RemoveRowButton,
  SHOW_ON_ROW_HOVER,
} from '@/components/molecules'

import { BuildScopePicker } from './BuildScopePicker'
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
// a step stays in the phase it was added to, and an empty phase shows a placeholder step.
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

      {PHASES.map(({ phase, title, minutesField }) => {
        const phaseSteps = stepsOf(phase)

        return (
          <div key={phase}>
            <h3 className='mb-3 flex items-baseline text-sm font-semibold tracking-wide text-accent uppercase'>
              {title}
              <span className='ml-1 flex items-baseline font-normal tracking-normal text-text-muted normal-case'>
                (~
                <InlineInput
                  fit
                  label={`${title} minutes`}
                  type='number'
                  error={errors[minutesField]?.message}
                  {...numberField(register, minutesField)}
                />
                &nbsp;min)
              </span>
            </h3>
            <ol className='flex flex-col gap-4'>
              {phaseSteps.map(({ id, index }) => {
                number += 1
                const hasDuration = rows[index]?.durationMinutes !== undefined

                return (
                  <li key={id} className='group/editable flex gap-4'>
                    <span
                      aria-hidden='true'
                      className='flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-on-primary'
                    >
                      {number}
                    </span>
                    <div className='min-w-0 flex-1 pt-0.5 text-text-muted'>
                      <div className='flex items-start gap-1'>
                        <MarkdownField
                          label={`Step ${index + 1}`}
                          error={errors.steps?.[index]?.body?.message}
                          fieldClassName='flex-1'
                          value={rows[index]?.body ?? ''}
                          registration={register(`steps.${index}.body`)}
                          placeholder='What to do. Markdown is fine here.'
                        />
                        <RemoveRowButton
                          label={`Remove step ${index + 1}`}
                          onClick={() => steps.remove(index)}
                        />
                      </div>
                      {/* Shown like the page's "About 5 min" once set, and on hover until then */}
                      <div
                        className={`mt-1 flex items-baseline text-xs text-text-muted ${hasDuration ? '' : SHOW_ON_ROW_HOVER}`}
                      >
                        About
                        {/* Padding offsets the field's negative margin, so its box clears the words */}
                        <InlineInput
                          fit
                          fieldClassName='px-3'
                          label={`Step ${index + 1} minutes`}
                          type='number'
                          step='any'
                          error={errors.steps?.[index]?.durationMinutes?.message}
                          placeholder='-'
                          {...numberField(
                            register,
                            `steps.${index}.durationMinutes`
                          )}
                        />
                        min
                      </div>
                      <div className='mt-1'>
                        <BuildScopePicker section='steps' index={index} />
                      </div>
                    </div>
                  </li>
                )
              })}
            </ol>
            <div className={phaseSteps.length > 0 ? 'mt-3' : ''}>
              {phaseSteps.length === 0 ? (
                <PlaceholderButton onClick={() => addStep(phase)}>
                  Add the first {title.toLowerCase()} step
                </PlaceholderButton>
              ) : (
                <AddRowButton onClick={() => addStep(phase)}>
                  Add {title.toLowerCase()} step
                </AddRowButton>
              )}
            </div>
          </div>
        )
      })}
    </section>
  )
}
