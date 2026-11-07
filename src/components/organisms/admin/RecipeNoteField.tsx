'use client'

import type { ReactElement } from 'react'

import { useWatch } from 'react-hook-form'

import { MarkdownField, RemoveRowButton } from '@/components/molecules'

import { useRecipeForm } from './recipeFormFields'

type RecipeNoteFieldProps = {
  index: number
  onRemove: () => void
  // The look of the note where it sits on the page, such as a card or a plain line
  className: string
  placeholder: string
}

// One note, drawn the way its section draws it on the page. It stays in that section.
export const RecipeNoteField = ({
  index,
  onRemove,
  className,
  placeholder,
}: RecipeNoteFieldProps): ReactElement => {
  const {
    control,
    register,
    formState: { errors },
  } = useRecipeForm()
  const body = useWatch({ control, name: `notes.${index}.body` })

  return (
    <div className={`group/editable relative ${className}`}>
      <MarkdownField
        label={`Note ${index + 1}`}
        error={errors.notes?.[index]?.body?.message}
        value={body}
        registration={register(`notes.${index}.body`)}
        placeholder={placeholder}
        className='pr-6'
      />
      <div className='absolute top-2 right-2'>
        <RemoveRowButton label={`Remove note ${index + 1}`} onClick={onRemove} />
      </div>
    </div>
  )
}
