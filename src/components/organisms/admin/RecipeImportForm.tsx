'use client'

import { useState } from 'react'

import type { ImportResult } from '@/libs/recipes'

import { toImportResult, useImportRecipe } from '@/apiClients'
import { Button } from '@/components/atoms'
import { ImportResultPanel } from '@/components/molecules'

type ImportIntent = 'preview' | 'import' | 'overwrite'

type ImportState = {
  intent?: ImportIntent
  // The JSON that produced the result, so Overwrite only applies to what was reviewed
  source?: string
  result?: ImportResult
  error?: string
}

const errorMessage = (error: unknown, fallback: string): string =>
  error instanceof Error ? error.message : fallback

export const RecipeImportForm = () => {
  const [importRecipe, { loading }] = useImportRecipe()
  const [json, setJson] = useState('')
  const [state, setState] = useState<ImportState>({})

  const isEmpty = !json.trim()
  // A preview of a changed recipe reports `updated` (it was not written), a save reports
  // `conflict`. Either way the changes shown are only valid for the JSON still in the box.
  const showsPendingChanges =
    state.result?.status === 'conflict' ||
    (state.intent === 'preview' && state.result?.status === 'updated')
  const canOverwrite = showsPendingChanges && state.source === json

  const run = async (intent: ImportIntent): Promise<void> => {
    let recipe: unknown
    try {
      recipe = JSON.parse(json)
    } catch (error) {
      setState({
        error: `That is not valid JSON: ${errorMessage(error, 'parse error')}`,
      })
      return
    }

    try {
      const { data } = await importRecipe({
        variables: {
          recipe,
          // A preview of an existing slug shows what an overwrite would change
          overwrite: intent !== 'import',
          dryRun: intent === 'preview',
        },
      })
      if (!data) {
        setState({ error: 'The import returned no data.' })
        return
      }
      setState({
        intent,
        source: json,
        result: toImportResult(data.importRecipe),
      })
    } catch (error) {
      setState({ error: errorMessage(error, 'The import failed.') })
    }
  }

  return (
    <form onSubmit={(event) => event.preventDefault()}>
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
        <Button disabled={loading || isEmpty} onClick={() => run('preview')}>
          Preview
        </Button>
        <Button disabled={loading || isEmpty} onClick={() => run('import')}>
          Save as draft
        </Button>
        {canOverwrite && (
          <Button
            disabled={loading || isEmpty}
            onClick={() => run('overwrite')}
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
