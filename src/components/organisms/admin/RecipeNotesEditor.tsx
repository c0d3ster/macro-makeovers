'use client'

import type { ReactElement } from 'react'
import type { UseFieldArrayReturn } from 'react-hook-form'

import { useWatch } from 'react-hook-form'

import type { RecipeImportInput } from '@/validations'

import { AddRowButton } from '@/components/molecules'

import { useRecipeForm } from './recipeFormFields'
import { RecipeNoteField } from './RecipeNoteField'

type RecipeNotesEditorProps = {
  // The notes list, owned by the form because the nutrition section edits it too
  notes: UseFieldArrayReturn<RecipeImportInput, 'notes'>
}

const SECTIONS: {
  kind: RecipeImportInput['notes'][number]['kind']
  title: string
  singular: string
}[] = [
  { kind: 'make_or_break', title: 'Make or break', singular: 'make or break' },
  { kind: 'tip', title: 'Tips', singular: 'tip' },
  { kind: 'fixes', title: 'Fixes', singular: 'fix' },
  { kind: 'levers', title: 'Levers', singular: 'lever' },
]

// The page's notes, with every section showing so one can be started from empty. A grid here
// instead of the page's columns, which would reflow the sections while typing.
export const RecipeNotesEditor = ({
  notes,
}: RecipeNotesEditorProps): ReactElement => {
  const { control } = useRecipeForm()
  const rows = useWatch({ control, name: 'notes' })

  return (
    <section aria-labelledby='notes-heading' className='flex flex-col gap-6'>
      <h2 id='notes-heading' className='text-2xl font-semibold text-text'>
        Notes
      </h2>

      <div className='grid grid-cols-1 gap-8 md:grid-cols-2 md:gap-x-10'>
        {SECTIONS.map(({ kind, title, singular }) => (
          <div key={kind} className='flex flex-col gap-3'>
            <h3 className='text-lg font-semibold text-text'>{title}</h3>
            {notes.fields.flatMap(({ id }, index) =>
              rows[index]?.kind === kind
                ? [
                    <RecipeNoteField
                      key={id}
                      index={index}
                      onRemove={() => notes.remove(index)}
                    />,
                  ]
                : []
            )}
            <AddRowButton onClick={() => notes.append({ kind, body: '' })}>
              Add {singular}
            </AddRowButton>
          </div>
        ))}
      </div>
    </section>
  )
}
