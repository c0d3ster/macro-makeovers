import type { ReactElement } from 'react'

import Link from 'next/link'

type GuideLink = {
  href: string
  title: string
  blurb: string
}

type GuideLinksProps = {
  guides: GuideLink[]
}

export const GuideLinks = ({ guides }: GuideLinksProps): ReactElement => (
  <ul className='grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4'>
    {guides.map(({ href, title, blurb }) => (
      <li key={href}>
        <Link
          href={href}
          className='flex h-full flex-col rounded-xl border border-text-muted/20 p-4 transition-colors hover:border-primary focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none'
        >
          <span className='font-semibold text-text'>{title}</span>
          <span className='mt-1 text-sm text-text-muted'>{blurb}</span>
        </Link>
      </li>
    ))}
  </ul>
)
