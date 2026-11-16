import type { ReactNode } from 'react'

import type { BasketPricing } from '@/apiClients'
import type { FieldChange, ImportResult } from '@/libs/recipes'

import { formatMoney } from '@/libs/basket'

type ImportResultPanelProps = {
  result: ImportResult
  // A preview: nothing was written
  dryRun: boolean
  // Each build's cost per serving, when the recipe has basket lines
  basket?: BasketPricing
}

const TIERS = ['$', '$$', '$$$', '$$$$', '$$$$$']

// Cost per serving and tier for each build, then any tier the prices disagree with
const BasketPrices = ({ prices, warnings }: BasketPricing) =>
  prices.length > 0 && (
    <div className='mt-6 rounded-lg border border-text-muted/30 bg-surface p-4'>
      <p className='font-semibold text-text'>Basket cost per serving</p>
      <ul className='mt-3 space-y-1 text-sm text-text-muted'>
        {prices.map(({ build, perServing, tier }) => (
          <li key={build}>
            <span className='text-text'>{build}</span>: {formatMoney(perServing)},{' '}
            {TIERS[tier - 1]}
          </li>
        ))}
      </ul>
      {warnings.length > 0 && (
        <ul className='mt-3 space-y-1 text-sm text-yellow-400'>
          {warnings.map(({ path, message }) => (
            <li key={`${path}|${message}`}>{message}</li>
          ))}
        </ul>
      )}
    </div>
  )

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

export const ImportResultPanel = ({ basket, ...props }: ImportResultPanelProps) => (
  <>
    <ResultPanel {...props} />
    {basket && props.result.status !== 'invalid' && <BasketPrices {...basket} />}
  </>
)

const ResultPanel = ({ result, dryRun }: Omit<ImportResultPanelProps, 'basket'>) => {
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
