'use client'

import type { ReactElement, ReactNode } from 'react'
import type { UseFormRegister } from 'react-hook-form'

import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { useFieldArray, useForm } from 'react-hook-form'

import type { ImportIssue } from '@/libs/recipes'
import type { RecipeImport, RecipeImportInput } from '@/validations'

import { Button } from '@/components/atoms'
import { FILTER_FIELD_CLASS } from '@/components/molecules'
import { recipeImportSchema } from '@/validations'

export type SaveRecipeResult =
  | { ok: true; id: string; slug: string; summary: string }
  | { ok: false; error: string; issues?: ImportIssue[] }

type RecipeFormProps = {
  // Set when editing. The slug is then fixed, because it is the recipe's address.
  recipeId?: string
  initial?: RecipeImportInput
  action: (recipeId: string | undefined, input: unknown) => Promise<SaveRecipeResult>
}

const EMPTY_RECIPE: RecipeImportInput = {
  slug: '',
  title: '',
  summary: '',
  servings: 4,
  prepMinutes: 15,
  cookMinutes: 30,
  costTier: 2,
  difficulty: 2,
  tags: [],
  nutrition: [
    {
      kind: 'makeover',
      label: 'Makeover',
      isDefault: true,
      calories: 0,
      carbsG: 0,
      fatG: 0,
      proteinG: 0,
    },
  ],
  ingredients: [{ raw: '' }],
  steps: [{ phase: 'prep', body: '' }],
  notes: [],
}

const NOTE_KINDS: RecipeImportInput['notes'][number]['kind'][] = [
  'make_or_break',
  'fixes',
  'levers',
  'tip',
  'nutrition_intro',
  'nutrition_analysis',
]

// Blank inputs mean "not set", which the schema expects as a missing field
const optionalText = (value: unknown): string | undefined =>
  typeof value === 'string' && value.trim() ? value : undefined
const optionalNumber = (value: unknown): number | undefined =>
  value === '' || value === undefined || value === null
    ? undefined
    : Number(value)

const fieldLabel = 'flex flex-col gap-1 text-xs font-medium text-text-muted'

type SectionProps = {
  title: string
  onAdd?: () => void
  addLabel?: string
  children: ReactNode
}

const Section = ({
  title,
  onAdd,
  addLabel,
  children,
}: SectionProps): ReactElement => (
  <fieldset className='flex flex-col gap-3 rounded-xl bg-surface p-4'>
    <legend className='px-1 text-lg font-semibold text-text'>{title}</legend>
    {children}
    {onAdd && (
      <div>
        <Button type='button' size='sm' onClick={onAdd}>
          {addLabel ?? 'Add'}
        </Button>
      </div>
    )}
  </fieldset>
)

type FieldProps = {
  label: string
  error?: string
  children: ReactNode
}

const Field = ({ label, error, children }: FieldProps): ReactElement => (
  <label className={fieldLabel}>
    {label}
    {children}
    {error && (
      <span role='alert' className='text-red-400'>
        {error}
      </span>
    )}
  </label>
)

type RemoveButtonProps = { label: string; onClick: () => void }

const RemoveButton = ({ label, onClick }: RemoveButtonProps): ReactElement => (
  <button
    type='button'
    aria-label={label}
    onClick={onClick}
    className='self-start text-sm text-text-muted underline hover:text-text'
  >
    Remove
  </button>
)

const numberField = (
  register: UseFormRegister<RecipeImportInput>,
  name: Parameters<UseFormRegister<RecipeImportInput>>[0]
): ReturnType<UseFormRegister<RecipeImportInput>> =>
  register(name, { setValueAs: optionalNumber })

export const RecipeForm = ({
  recipeId,
  initial = EMPTY_RECIPE,
  action,
}: RecipeFormProps): ReactElement => {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [result, setResult] = useState<SaveRecipeResult>()

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<RecipeImportInput, unknown, RecipeImport>({
    resolver: zodResolver(recipeImportSchema),
    defaultValues: initial,
  })
  const nutrition = useFieldArray({ control, name: 'nutrition' })
  const ingredients = useFieldArray({ control, name: 'ingredients' })
  const steps = useFieldArray({ control, name: 'steps' })
  const notes = useFieldArray({ control, name: 'notes' })

  const save = handleSubmit((values) => {
    setResult(undefined)
    startTransition(async () => {
      const saved = await action(recipeId, values)
      setResult(saved)
      if (saved.ok && !recipeId) router.push(`/admin/recipes/${saved.id}/edit`)
    })
  })

  return (
    <form onSubmit={save} className='flex flex-col gap-6' noValidate>
      <Section title='Basics'>
        <Field label='Slug' error={errors.slug?.message}>
          <input
            {...register('slug')}
            readOnly={Boolean(recipeId)}
            className={FILTER_FIELD_CLASS}
            placeholder='blackened-chicken-alfredo'
          />
        </Field>
        <Field label='Title' error={errors.title?.message}>
          <input {...register('title')} className={FILTER_FIELD_CLASS} />
        </Field>
        <Field label='Summary' error={errors.summary?.message}>
          <textarea
            {...register('summary')}
            rows={4}
            className={FILTER_FIELD_CLASS}
          />
        </Field>
        <div className='grid grid-cols-2 gap-3 sm:grid-cols-5'>
          <Field label='Servings' error={errors.servings?.message}>
            <input
              type='number'
              {...numberField(register, 'servings')}
              className={FILTER_FIELD_CLASS}
            />
          </Field>
          <Field label='Prep (min)' error={errors.prepMinutes?.message}>
            <input
              type='number'
              {...numberField(register, 'prepMinutes')}
              className={FILTER_FIELD_CLASS}
            />
          </Field>
          <Field label='Cook (min)' error={errors.cookMinutes?.message}>
            <input
              type='number'
              {...numberField(register, 'cookMinutes')}
              className={FILTER_FIELD_CLASS}
            />
          </Field>
          <Field label='Cost (1 to 5)' error={errors.costTier?.message}>
            <input
              type='number'
              {...numberField(register, 'costTier')}
              className={FILTER_FIELD_CLASS}
            />
          </Field>
          <Field label='Difficulty (1 to 5)' error={errors.difficulty?.message}>
            <input
              type='number'
              {...numberField(register, 'difficulty')}
              className={FILTER_FIELD_CLASS}
            />
          </Field>
        </div>
        <Field label='Variant of (slug, optional)' error={errors.variantOf?.message}>
          <input
            {...register('variantOf', { setValueAs: optionalText })}
            className={FILTER_FIELD_CLASS}
          />
        </Field>
        <Field label='Tags (comma separated)' error={errors.tags?.message}>
          <input
            {...register('tags', {
              setValueAs: (value: unknown) =>
                Array.isArray(value)
                  ? value
                  : String(value ?? '')
                      .split(',')
                      .map((tag) => tag.trim())
                      .filter(Boolean),
            })}
            className={FILTER_FIELD_CLASS}
          />
        </Field>
      </Section>

      <Section
        title='Nutrition'
        addLabel='Add row'
        onAdd={() =>
          nutrition.append({
            kind: 'traditional',
            label: 'Traditional',
            isDefault: false,
            calories: 0,
            carbsG: 0,
            fatG: 0,
            proteinG: 0,
          })
        }
      >
        {errors.nutrition?.message && (
          <p role='alert' className='text-red-400'>
            {errors.nutrition.message}
          </p>
        )}
        {nutrition.fields.map((row, index) => (
          <div
            key={row.id}
            className='grid grid-cols-2 items-end gap-3 sm:grid-cols-4'
          >
            <Field label='Kind'>
              <select
                {...register(`nutrition.${index}.kind`)}
                className={FILTER_FIELD_CLASS}
              >
                <option value='makeover'>Makeover</option>
                <option value='traditional'>Traditional</option>
              </select>
            </Field>
            <Field
              label='Label'
              error={errors.nutrition?.[index]?.label?.message}
            >
              <input
                {...register(`nutrition.${index}.label`)}
                className={FILTER_FIELD_CLASS}
              />
            </Field>
            <Field label='Calories'>
              <input
                type='number'
                {...numberField(register, `nutrition.${index}.calories`)}
                className={FILTER_FIELD_CLASS}
              />
            </Field>
            <Field label='Carbs (g)'>
              <input
                type='number'
                {...numberField(register, `nutrition.${index}.carbsG`)}
                className={FILTER_FIELD_CLASS}
              />
            </Field>
            <Field label='Fat (g)'>
              <input
                type='number'
                {...numberField(register, `nutrition.${index}.fatG`)}
                className={FILTER_FIELD_CLASS}
              />
            </Field>
            <Field label='Protein (g)'>
              <input
                type='number'
                {...numberField(register, `nutrition.${index}.proteinG`)}
                className={FILTER_FIELD_CLASS}
              />
            </Field>
            <label className='flex items-center gap-2 text-sm text-text'>
              <input
                type='checkbox'
                {...register(`nutrition.${index}.isDefault`)}
              />
              Featured
            </label>
            <RemoveButton
              label={`Remove nutrition row ${index + 1}`}
              onClick={() => nutrition.remove(index)}
            />
            {errors.nutrition?.[index]?.isDefault?.message && (
              <p role='alert' className='col-span-full text-red-400'>
                {errors.nutrition[index].isDefault.message}
              </p>
            )}
          </div>
        ))}
      </Section>

      <Section
        title='Ingredients'
        addLabel='Add ingredient'
        onAdd={() => ingredients.append({ raw: '' })}
      >
        {errors.ingredients?.message && (
          <p role='alert' className='text-red-400'>
            {errors.ingredients.message}
          </p>
        )}
        {ingredients.fields.map((row, index) => (
          <div
            key={row.id}
            className='grid grid-cols-1 items-end gap-3 sm:grid-cols-[1fr_2fr_auto]'
          >
            <Field label='Group'>
              <input
                {...register(`ingredients.${index}.group`, {
                  setValueAs: optionalText,
                })}
                className={FILTER_FIELD_CLASS}
                placeholder='Sauce'
              />
            </Field>
            <Field
              label='Ingredient'
              error={errors.ingredients?.[index]?.raw?.message}
            >
              <input
                {...register(`ingredients.${index}.raw`)}
                className={FILTER_FIELD_CLASS}
                placeholder='2 lbs chicken breast'
              />
            </Field>
            <RemoveButton
              label={`Remove ingredient ${index + 1}`}
              onClick={() => ingredients.remove(index)}
            />
          </div>
        ))}
      </Section>

      <Section
        title='Steps'
        addLabel='Add step'
        onAdd={() => steps.append({ phase: 'cook', body: '' })}
      >
        {errors.steps?.message && (
          <p role='alert' className='text-red-400'>
            {errors.steps.message}
          </p>
        )}
        {steps.fields.map((row, index) => (
          <div key={row.id} className='flex flex-col gap-3'>
            <div className='grid grid-cols-2 items-end gap-3 sm:grid-cols-[auto_auto_1fr]'>
              <Field label='Phase'>
                <select
                  {...register(`steps.${index}.phase`)}
                  className={FILTER_FIELD_CLASS}
                >
                  <option value='prep'>Prep</option>
                  <option value='cook'>Cook</option>
                </select>
              </Field>
              <Field
                label='Minutes (optional)'
                error={errors.steps?.[index]?.durationMinutes?.message}
              >
                <input
                  type='number'
                  step='any'
                  {...numberField(register, `steps.${index}.durationMinutes`)}
                  className={FILTER_FIELD_CLASS}
                />
              </Field>
              <RemoveButton
                label={`Remove step ${index + 1}`}
                onClick={() => steps.remove(index)}
              />
            </div>
            <Field
              label={`Step ${index + 1}`}
              error={errors.steps?.[index]?.body?.message}
            >
              <textarea
                {...register(`steps.${index}.body`)}
                rows={3}
                className={FILTER_FIELD_CLASS}
              />
            </Field>
          </div>
        ))}
      </Section>

      <Section
        title='Notes'
        addLabel='Add note'
        onAdd={() => notes.append({ kind: 'tip', body: '' })}
      >
        {notes.fields.map((row, index) => (
          <div key={row.id} className='flex flex-col gap-3'>
            <div className='flex items-end gap-3'>
              <Field label='Kind'>
                <select
                  {...register(`notes.${index}.kind`)}
                  className={FILTER_FIELD_CLASS}
                >
                  {NOTE_KINDS.map((kind) => (
                    <option key={kind} value={kind}>
                      {kind.replaceAll('_', ' ')}
                    </option>
                  ))}
                </select>
              </Field>
              <RemoveButton
                label={`Remove note ${index + 1}`}
                onClick={() => notes.remove(index)}
              />
            </div>
            <Field
              label='Markdown'
              error={errors.notes?.[index]?.body?.message}
            >
              <textarea
                {...register(`notes.${index}.body`)}
                rows={4}
                className={FILTER_FIELD_CLASS}
              />
            </Field>
          </div>
        ))}
      </Section>

      <div className='sticky bottom-0 flex flex-wrap items-center gap-4 bg-background py-3'>
        <Button type='submit' disabled={isPending}>
          {isPending ? 'Saving...' : 'Save'}
        </Button>
        {result?.ok && (
          <p role='status' className='text-sm text-text'>
            {result.summary}
          </p>
        )}
        {result && !result.ok && (
          <div role='alert' className='text-sm text-red-400'>
            <p>{result.error}</p>
            {result.issues?.map(({ path, message }) => (
              <p key={`${path}:${message}`}>
                {path}: {message}
              </p>
            ))}
          </div>
        )}
      </div>
    </form>
  )
}
