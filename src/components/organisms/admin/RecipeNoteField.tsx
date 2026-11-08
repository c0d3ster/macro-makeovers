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
  // Take the focus on mount, for a note just added
  focusOnMount?: boolean
}

// One note, drawn the way its section draws it on the page. It stays in that section. The X sits
// inside the field, centered on its first line.
export const RecipeNoteField = ({
  index,
  onRemove,
  className,
  placeholder,
  focusOnMount = false,
}: RecipeNoteFieldProps): ReactElement => {
  const {
    control,
    register,
    formState: { errors },
  } = useRecipeForm()
  const body = useWatch({ control, name: `notes.${index}.body` })

  return (
    <div className={`group/editable ${className}`}>
      <div className='relative'>
        <MarkdownField
          label={`Note ${index + 1}`}
          error={errors.notes?.[index]?.body?.message}
          value={body}
          registration={register(`notes.${index}.body`)}
          placeholder={placeholder}
          focusOnMount={focusOnMount}
          className='pr-8'
        />
        {/* The field's negative margin puts its border 7px past this box, so this keeps the X
            just inside it */}
        <div className='absolute top-0 right-0'>
          <RemoveRowButton
            label={`Remove note ${index + 1}`}
            onClick={onRemove}
          />
        </div>
      </div>
    </div>
  )
}
