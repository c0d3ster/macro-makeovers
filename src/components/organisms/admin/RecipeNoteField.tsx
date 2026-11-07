'use client'

import type { ReactElement } from 'react'

import {
  InlineSelect,
  InlineTextarea,
  RemoveRowButton,
} from '@/components/molecules'

import { useRecipeForm } from './recipeFormFields'

const NOTE_KINDS = [
  { kind: 'make_or_break', title: 'Make or break' },
  { kind: 'tip', title: 'Tips' },
  { kind: 'fixes', title: 'Fixes' },
  { kind: 'levers', title: 'Levers' },
  { kind: 'nutrition_intro', title: 'Nutrition intro' },
  { kind: 'nutrition_analysis', title: 'Nutrition analysis' },
] as const

type RecipeNoteFieldProps = {
  index: number
  onRemove: () => void
}

// One note as its card on the page. Changing the kind moves it to that section.
export const RecipeNoteField = ({
  index,
  onRemove,
}: RecipeNoteFieldProps): ReactElement => {
  const {
    register,
    formState: { errors },
  } = useRecipeForm()

  return (
    <div className='flex flex-col gap-2 rounded-xl bg-surface px-4 py-3'>
      <InlineTextarea
        label={`Note ${index + 1}`}
        error={errors.notes?.[index]?.body?.message}
        rows={3}
        placeholder='Markdown is fine here'
        className='text-text-muted'
        {...register(`notes.${index}.body`)}
      />
      <div className='flex items-center justify-between gap-2'>
        <InlineSelect
          label={`Note ${index + 1} section`}
          className='text-xs text-text-muted'
          fieldClassName='w-fit'
          {...register(`notes.${index}.kind`)}
        >
          {NOTE_KINDS.map(({ kind, title }) => (
            <option key={kind} value={kind}>
              {title}
            </option>
          ))}
        </InlineSelect>
        <RemoveRowButton label={`Remove note ${index + 1}`} onClick={onRemove} />
      </div>
    </div>
  )
}
