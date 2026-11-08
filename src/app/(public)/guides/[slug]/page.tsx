import type { Metadata } from 'next'
import type { ReactElement } from 'react'

import Link from 'next/link'
import { notFound } from 'next/navigation'

import { BackLink, Button, Prose } from '@/components/atoms'
import { LandingPageTemplate } from '@/components/templates'
import { findGuide, GUIDES, readGuide } from '@/libs/guides'

type GuidePageProps = {
  params: Promise<{ slug: string }>
}

// Every guide is a file in content/guides, so the pages are built ahead and anything else 404s
export const dynamicParams = false

export const generateStaticParams = (): { slug: string }[] =>
  GUIDES.map(({ slug }) => ({ slug }))

export const generateMetadata = async ({
  params,
}: GuidePageProps): Promise<Metadata> => {
  const guide = findGuide((await params).slug)
  if (!guide) return {}

  return {
    title: guide.title,
    description: guide.description,
    alternates: { canonical: `/guides/${guide.slug}` },
  }
}

const GuidePage = async ({ params }: GuidePageProps): Promise<ReactElement> => {
  const guide = findGuide((await params).slug)
  if (!guide) notFound()
  const others = GUIDES.filter(({ slug }) => slug !== guide.slug)

  return (
    <LandingPageTemplate activeItem='guides'>
      <main className='mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8'>
        <BackLink href='/guides'>All guides</BackLink>
        <h1 className='mt-4 mb-2 text-3xl font-bold text-text sm:text-4xl'>
          {guide.title}
        </h1>
        <p className='mb-10 text-lg text-text-muted'>{guide.description}</p>

        <Prose>{readGuide(guide.slug)}</Prose>

        <div className='mt-12 border-t border-text-muted/20 pt-8'>
          <h2 className='mb-3 text-sm font-medium text-text-muted'>
            More guides
          </h2>
          <ul className='mb-8 space-y-2'>
            {others.map(({ slug, title }) => (
              <li key={slug}>
                <Link
                  href={`/guides/${slug}`}
                  className='text-text underline hover:text-primary'
                >
                  {title}
                </Link>
              </li>
            ))}
          </ul>
          <Button href='/recipes'>Browse recipes</Button>
        </div>
      </main>
    </LandingPageTemplate>
  )
}

export default GuidePage
