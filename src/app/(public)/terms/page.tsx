import type { Metadata } from 'next'
import type { ReactElement } from 'react'

import { LegalPageTemplate } from '@/components/templates'
import { findLegalPage, readLegalPage } from '@/libs/legal'

const PAGE = findLegalPage('terms')

export const metadata: Metadata = {
  title: PAGE.title,
  description: PAGE.description,
  alternates: { canonical: '/terms' },
}

const TermsPage = (): ReactElement => (
  <LegalPageTemplate
    slug={PAGE.slug}
    title={PAGE.title}
    updated={PAGE.updated}
    body={readLegalPage(PAGE.slug)}
  />
)

export default TermsPage
