import type { Metadata } from 'next'
import type { ReactElement } from 'react'

import Link from 'next/link'

import { FilterBar, RecipeGrid } from '@/components/organisms'
import { LandingPageTemplate } from '@/components/templates'
import { Env } from '@/libs/Env'
import { collectTags, parseRecipeFilters, toTagPath } from '@/libs/recipes'

import { loadRecipeBrowse } from '../../loadRecipeBrowse'

type TagPageProps = {
  params: Promise<{ tag: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

// A malformed escape in the URL falls back to the raw segment instead of throwing
const decodeTag = (segment: string): string => {
  try {
    return decodeURIComponent(segment).toLowerCase()
  } catch {
    return segment.toLowerCase()
  }
}

export const generateMetadata = async ({
  params,
}: Pick<TagPageProps, 'params'>): Promise<Metadata> => {
  const tag = decodeTag((await params).tag)

  return {
    title: `${tag} recipes`,
    description: `${tag} recipes from ${Env.NEXT_PUBLIC_BRAND_NAME}, rebuilt to cut the fat and add protein.`,
    alternates: { canonical: toTagPath(tag) },
  }
}

const TagPage = async ({
  params,
  searchParams,
}: TagPageProps): Promise<ReactElement> => {
  const tag = decodeTag((await params).tag)
  const filters = { ...parseRecipeFilters(await searchParams), tag }
  const browse = await loadRecipeBrowse(filters)
  // Show the tag the way it was written in the data, e.g. "Meal Prep"
  const displayName =
    collectTags(browse?.all ?? []).find((name) => name.toLowerCase() === tag) ??
    tag

  const intro = (
    <header>
      <Link
        href='/'
        className='text-sm text-text-muted underline hover:text-text'
      >
        All recipes
      </Link>
      <h1 className='mt-3 text-3xl font-bold text-text sm:text-4xl'>
        {displayName}
      </h1>
    </header>
  )

  return (
    <LandingPageTemplate>
      <main className='mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8'>
        {browse ? (
          <>
            <FilterBar
              filters={filters}
              tagGroups={browse.tagGroups}
              unavailable={browse.unavailable}
              intro={intro}
              action={toTagPath(tag)}
            />
            <RecipeGrid
              recipes={browse.visible}
              isFiltered={browse.all.length > 0}
            />
          </>
        ) : (
          <>
            <div className='mb-8'>{intro}</div>
            <p className='rounded-xl bg-surface p-8 text-center text-text-muted'>
              Recipes are unavailable right now. Please try again in a minute.
            </p>
          </>
        )}
      </main>
    </LandingPageTemplate>
  )
}

export default TagPage
