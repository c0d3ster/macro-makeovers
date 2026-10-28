import type { ReactNode } from 'react'

import type { FieldChange, ImportResult } from '@/libs/recipes'

type ImportResultPanelProps = {
  result: ImportResult
  // A preview: nothing was written
  dryRun: boolean
}

type PanelProps = {
  tone: 'good' | 'warn' | 'bad'
  title: string
  children?: ReactNode
}

const toneBorders: Record<PanelProps['tone'], string> = {
  good: 'border-green-500/60',
  warn: 'border-yellow-500/60',
  bad: 'border-red-500/60',
}

const formatValue = (value: unknown): string => {
  if (value === undefined) return '(none)'
  const text = JSON.stringify(value)
  return text.length > 120 ? `${text.slice(0, 117)}...` : text
}

const ChangeList = ({ changes }: { changes: FieldChange[] }) => (
  <ul className='mt-3 space-y-1 font-mono text-sm text-text-muted'>
    {changes.map(({ path, before, after }) => (
      <li key={`${path}|${formatValue(before)}|${formatValue(after)}`}>
        <span className='text-text'>{path}</span>: {formatValue(before)}
        {' -> '}
        {formatValue(after)}
      </li>
    ))}
  </ul>
)

const Panel = ({ tone, title, children }: PanelProps) => (
  <div
    role='status'
    className={`mt-6 rounded-lg border bg-surface p-4 ${toneBorders[tone]}`}
  >
    <p className='font-semibold text-text'>{title}</p>
    {children}
  </div>
)

export const ImportResultPanel = ({
  result,
  dryRun,
}: ImportResultPanelProps) => {
  switch (result.status) {
    case 'invalid':
      return (
        <Panel tone='bad' title='Fix these fields and try again'>
          <ul className='mt-3 space-y-1 font-mono text-sm text-text-muted'>
            {result.issues.map(({ path, message }) => (
              <li key={`${path}|${message}`}>
                <span className='text-text'>{path || '(root)'}</span>: {message}
              </li>
            ))}
          </ul>
        </Panel>
      )
    case 'created':
      return (
        <Panel
          tone='good'
          title={
            dryRun
              ? `"${result.slug}" is new and would be saved as a draft`
              : `Saved "${result.slug}" as a draft`
          }
        />
      )
    case 'unchanged':
      return (
        <Panel
          tone='good'
          title={`"${result.slug}" already matches this recipe, nothing to change`}
        />
      )
    case 'updated':
      return (
        <Panel
          tone='good'
          title={
            dryRun
              ? `"${result.slug}" exists. An overwrite would change:`
              : `Updated "${result.slug}". Its published status is unchanged.`
          }
        >
          <ChangeList changes={result.changes} />
        </Panel>
      )
    case 'conflict':
      return (
        <Panel
          tone='warn'
          title={`"${result.slug}" already exists. Overwriting would change:`}
        >
          <ChangeList changes={result.changes} />
        </Panel>
      )
  }
}
