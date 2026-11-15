import type { ReactElement } from 'react'

import type { GrocerInfo } from '@/libs/grocery'

type UnmatchedLine = {
  key: string
  name: string
  display: string
}

type HandoffSummaryProps = {
  info: GrocerInfo
  url: string
  matchedCount: number
  unmatched: readonly UnmatchedLine[]
}

// What a send did: a link to the grocer, and every line it couldn't take (never dropped quietly)
export const HandoffSummary = ({
  info,
  url,
  matchedCount,
  unmatched,
}: HandoffSummaryProps): ReactElement => (
  <div role='status' className='flex flex-col gap-3 rounded-lg border border-primary/40 p-3'>
    <p className='text-text'>
      {matchedCount} {matchedCount === 1 ? 'item' : 'items'} sent to {info.name}.
    </p>
    <a
      href={url}
      target='_blank'
      rel='noopener noreferrer'
      className='self-start rounded-lg bg-primary px-4 py-2 font-medium text-on-primary hover:bg-primary/90'
    >
      {info.openLabel}
    </a>
    {unmatched.length > 0 && (
      <div>
        <p className='text-sm font-medium text-text'>
          {info.name} couldn&apos;t match these. Add them yourself:
        </p>
        <ul className='mt-1 list-disc pl-5 text-sm text-text-muted'>
          {unmatched.map(({ key, name, display }) => (
            <li key={key}>
              {name}: {display}
            </li>
          ))}
        </ul>
      </div>
    )}
  </div>
)
