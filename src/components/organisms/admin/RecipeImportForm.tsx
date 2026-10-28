'use client'

import { useActionState, useState } from 'react'

import type { ImportResult } from '@/libs/recipes'

import { Button } from '@/components/atoms'
import { ImportResultPanel } from '@/components/molecules'

export type ImportIntent = 'preview' | 'import' | 'overwrite'

export type RecipeImportFormState = {
  intent?: ImportIntent
  result?: ImportResult
  error?: string
}

type RecipeImportFormProps = {
  action: (
    previous: RecipeImportFormState,
    formData: FormData
  ) => Promise<RecipeImportFormState>
}

export const RecipeImportForm = ({ action }: RecipeImportFormProps) => {
  const [state, formAction, isPending] = useActionState(action, {})
  // Controlled so the text survives the form reset that follows an action
  const [json, setJson] = useState('')

  const isEmpty = !json.trim()
  const canOverwrite = state.result?.status === 'conflict'

  return (
    <form action={formAction}>
      <label htmlFor='recipe-json' className='mb-2 block font-medium text-text'>
        Recipe JSON
      </label>
      <textarea
        id='recipe-json'
        name='json'
        value={json}
        onChange={(event) => setJson(event.target.value)}
        rows={18}
        spellCheck={false}
        placeholder='{ "slug": "blackened-chicken-alfredo", "title": "...", ... }'
        className='w-full rounded border border-gray-600 bg-surface p-3 font-mono text-sm text-text placeholder-gray-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-400 focus:outline-none'
      />

      <div className='mt-4 flex flex-wrap gap-3'>
        <Button
          type='submit'
          name='intent'
          value='preview'
          disabled={isPending || isEmpty}
        >
          Preview
        </Button>
        <Button
          type='submit'
          name='intent'
          value='import'
          disabled={isPending || isEmpty}
        >
          Save as draft
        </Button>
        {canOverwrite && (
          <Button
            type='submit'
            name='intent'
            value='overwrite'
            disabled={isPending || isEmpty}
          >
            Overwrite existing
          </Button>
        )}
      </div>

      {state.error && (
        <p role='alert' className='mt-6 text-red-400'>
          {state.error}
        </p>
      )}
      {state.result && (
        <ImportResultPanel
          result={state.result}
          dryRun={state.intent === 'preview'}
        />
      )}
    </form>
  )
}
