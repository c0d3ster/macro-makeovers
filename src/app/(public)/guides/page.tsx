import type { Metadata } from 'next'
import type { ReactElement } from 'react'

import Link from 'next/link'

import { LandingPageTemplate } from '@/components/templates'
import { Env } from '@/libs/Env'
import { GUIDES } from '@/libs/guides'

export const metadata: Metadata = {
  title: 'Guides',
  description: `The ${Env.NEXT_PUBLIC_BRAND_NAME} guides to nutrition targets, shopping, and reading a recipe.`,
  alternates: { canonical: '/guides' },
}

const GuidesPage = (): ReactElement => (
  <LandingPageTemplate activeItem='guides'>
    <main className='mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8'>
      <h1 className='mb-3 text-3xl font-bold text-text sm:text-4xl'>Guides</h1>
      <p className='mb-10 text-lg text-text-muted'>
        The thinking behind the recipes: how the macros are set, what to buy,
        and how to read each recipe.
      </p>
      <ul className='space-y-3'>
        {GUIDES.map(({ slug, title, description }) => (
          <li key={slug}>
            <Link
              href={`/guides/${slug}`}
              className='block rounded-xl bg-surface p-5 transition-colors hover:bg-surface/80 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none'
            >
              <span className='block text-lg font-semibold text-text'>
                {title}
              </span>
              <span className='mt-1 block text-text-muted'>{description}</span>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  </LandingPageTemplate>
)

export default GuidesPage
