import type { ReactElement } from 'react'

import Link from 'next/link'

import { Prose } from '@/components/atoms'
import { LEGAL_PAGES } from '@/libs/legal/legalList'

import { LandingPageTemplate } from './LandingPageTemplate'

type LegalPageTemplateProps = {
  slug: string
  title: string
  // ISO date, shown as "Last updated"
  updated: string
  // The page's markdown, already read and filled in
  body: string
}

const formatUpdated = (iso: string): string =>
  new Date(`${iso}T12:00:00Z`).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  })

// The disclaimer, privacy, terms, and refund pages: same reading layout as the guides, with
// links to the other legal pages at the end
export const LegalPageTemplate = ({
  slug,
  title,
  updated,
  body,
}: LegalPageTemplateProps): ReactElement => (
  <LandingPageTemplate>
    <main className='mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8'>
      <h1 className='mb-2 text-3xl font-bold text-text sm:text-4xl'>{title}</h1>
      <p className='mb-10 text-sm text-text-muted'>
        Last updated {formatUpdated(updated)}
      </p>

      <Prose>{body}</Prose>

      <div className='mt-12 border-t border-text-muted/20 pt-8'>
        <h2 className='mb-3 text-sm font-medium text-text-muted'>
          More policies
        </h2>
        <ul className='space-y-2'>
          {LEGAL_PAGES.filter((page) => page.slug !== slug).map(
            ({ slug: other, title: otherTitle }) => (
              <li key={other}>
                <Link
                  href={`/${other}`}
                  className='text-text underline hover:text-primary'
                >
                  {otherTitle}
                </Link>
              </li>
            )
          )}
        </ul>
      </div>
    </main>
  </LandingPageTemplate>
)
