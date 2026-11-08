'use client'

import type { ReactElement } from 'react'
import type { UseFieldArrayReturn } from 'react-hook-form'

import { useState } from 'react'
import { useWatch } from 'react-hook-form'

import type { RecipeImportInput } from '@/validations'

import { AddRowButton, PlaceholderButton } from '@/components/molecules'

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
  example: string
}[] = [
  {
    kind: 'make_or_break',
    title: 'Make or break',
    singular: 'make or break',
    example: 'the one thing that decides whether this works',
  },
  {
    kind: 'tip',
    title: 'Tips',
    singular: 'tip',
    example: 'a small thing that makes it better',
  },
  {
    kind: 'fixes',
    title: 'Fixes',
    singular: 'fix',
    example: 'what went wrong and how to save it',
  },
  {
    kind: 'levers',
    title: 'Levers',
    singular: 'lever',
    example: 'a swap that moves the macros',
  },
]

// The page's note cards. Every section shows, with a placeholder card when it is empty, so one
// can be started in place. A grid here instead of the page's columns, which would reflow the
// sections while typing.
export const RecipeNotesEditor = ({
  notes,
}: RecipeNotesEditorProps): ReactElement => {
  const { control } = useRecipeForm()
  const rows = useWatch({ control, name: 'notes' })
  // The note just added, which takes the focus as it shows
  const [addedNote, setAddedNote] = useState<number>()

  return (
    <section aria-labelledby='notes-heading' className='flex flex-col gap-6'>
      <h2 id='notes-heading' className='text-2xl font-semibold text-text'>
        Notes
      </h2>

      <div className='grid grid-cols-1 gap-8 md:grid-cols-2 md:gap-x-10'>
        {SECTIONS.map(({ kind, title, singular, example }) => {
          const sectionNotes = notes.fields.flatMap(({ id }, index) =>
            rows[index]?.kind === kind ? [{ id, index }] : []
          )
          const add = (): void => {
            setAddedNote(notes.fields.length)
            notes.append({ kind, body: '' }, { shouldFocus: false })
          }

          return (
            <div key={kind} className='flex flex-col gap-3'>
              <h3 className='text-lg font-semibold text-text'>{title}</h3>
              <ul className='flex flex-col gap-3'>
                {sectionNotes.map(({ id, index }) => (
                  <li key={id}>
                    <RecipeNoteField
                      index={index}
                      onRemove={() => notes.remove(index)}
                      focusOnMount={index === addedNote}
                      className='rounded-xl bg-surface px-4 py-3 text-text-muted'
                      placeholder={`A ${singular}: ${example}`}
                    />
                  </li>
                ))}
              </ul>
              {sectionNotes.length === 0 ? (
                <PlaceholderButton onClick={add}>
                  Add a {singular} note: {example}
                </PlaceholderButton>
              ) : (
                <AddRowButton onClick={add}>Add {singular}</AddRowButton>
              )}
            </div>
          )
        })}
      </div>
    </section>
  )
}
