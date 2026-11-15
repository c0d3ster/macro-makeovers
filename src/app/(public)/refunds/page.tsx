import type { Metadata } from 'next'
import type { ReactElement } from 'react'

import { LegalPageTemplate } from '@/components/templates'
import { findLegalPage, readLegalPage } from '@/libs/legal'

const PAGE = findLegalPage('refunds')

export const metadata: Metadata = {
  title: PAGE.title,
  description: PAGE.description,
  alternates: { canonical: '/refunds' },
}

const RefundsPage = (): ReactElement => (
  <LegalPageTemplate
    slug={PAGE.slug}
    title={PAGE.title}
    updated={PAGE.updated}
    body={readLegalPage(PAGE.slug)}
  />
)

export default RefundsPage
