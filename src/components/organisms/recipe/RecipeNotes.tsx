import type { ReactElement } from 'react'

import type { RecipeNote } from '@/libs/recipes'

import { Markdown } from '@/components/atoms'

type RecipeNotesProps = {
  notes: RecipeNote[]
}

const SECTIONS: { kind: RecipeNote['kind']; title: string }[] = [
  { kind: 'make_or_break', title: 'Make or break' },
  { kind: 'tip', title: 'Tips' },
  { kind: 'fixes', title: 'Fixes' },
  { kind: 'levers', title: 'Levers' },
]

export const RecipeNotes = ({
  notes,
}: RecipeNotesProps): ReactElement | null => {
  if (notes.length === 0) return null

  return (
    <section aria-labelledby='notes-heading' className='flex flex-col gap-6'>
      <h2 id='notes-heading' className='text-2xl font-semibold text-text'>
        Notes
      </h2>

      {SECTIONS.map(({ kind, title }) => {
        const sectionNotes = notes.filter((note) => note.kind === kind)
        if (sectionNotes.length === 0) return null

        return (
          <div key={kind}>
            <h3 className='mb-3 text-lg font-semibold text-text'>{title}</h3>
            <ul className='flex flex-col gap-3'>
              {sectionNotes.map(({ body }) => (
                <li
                  key={body}
                  className='rounded-xl bg-surface px-4 py-3 text-text-muted'
                >
                  <Markdown>{body}</Markdown>
                </li>
              ))}
            </ul>
          </div>
        )
      })}
    </section>
  )
}
