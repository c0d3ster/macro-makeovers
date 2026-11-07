'use client'

import type { KeyboardEvent, ReactElement } from 'react'

import { useState } from 'react'

import { Badge } from '@/components/atoms'

type TagInputProps = {
  value: string[]
  onChange: (tags: string[]) => void
  error?: string
}

// Tags as the page shows them, with an input to add more. Enter, a comma, or leaving the field
// adds what was typed, so a tag is never lost by clicking Save right after typing it.
export const TagInput = ({
  value,
  onChange,
  error,
}: TagInputProps): ReactElement => {
  const [draft, setDraft] = useState('')

  const commit = (): void => {
    const added = draft
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean)
    setDraft('')
    if (added.length > 0) onChange([...new Set([...value, ...added])])
  }

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>): void => {
    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault()
      commit()
      return
    }
    if (event.key === 'Backspace' && draft === '') {
      onChange(value.slice(0, -1))
    }
  }

  return (
    <div className='flex flex-col gap-1'>
      <ul className='flex flex-wrap items-center gap-1.5'>
        {value.map((tag) => (
          <li key={tag}>
            <Badge>
              {tag}{' '}
              <button
                type='button'
                aria-label={`Remove tag ${tag}`}
                onClick={() => onChange(value.filter((other) => other !== tag))}
                className='cursor-pointer hover:text-text'
              >
                &times;
              </button>
            </Badge>
          </li>
        ))}
        <li>
          <label>
            <span className='sr-only'>Add tag</span>
            <input
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={onKeyDown}
              onBlur={commit}
              placeholder='Add tag'
              className='w-24 rounded-full border border-dashed border-text-muted/30 bg-transparent px-2.5 py-0.5 text-xs text-text placeholder:text-text-muted/60 focus-visible:border-primary focus-visible:outline-none'
            />
          </label>
        </li>
      </ul>
      {error && (
        <span role='alert' className='text-xs text-red-400'>
          {error}
        </span>
      )}
    </div>
  )
}
