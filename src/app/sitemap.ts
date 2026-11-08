import type { MetadataRoute } from 'next'

import { GUIDES } from '@/libs/guides'
import { getBaseUrl } from '@/utils/Env'

type SitemapEntry = MetadataRoute.Sitemap[number]

// The site's fixed pages. Recipe and tag pages are linked from these.
const STATIC_PAGES: Pick<
  SitemapEntry,
  'url' | 'changeFrequency' | 'priority'
>[] = [
  { url: '/', changeFrequency: 'daily', priority: 0.7 },
  { url: '/recipes', changeFrequency: 'daily', priority: 0.8 },
  { url: '/guides', changeFrequency: 'monthly', priority: 0.5 },
  ...GUIDES.map(({ slug }) => ({
    url: `/guides/${slug}`,
    changeFrequency: 'monthly' as const,
    priority: 0.5,
  })),
  { url: '/about', changeFrequency: 'monthly', priority: 0.4 },
]

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date()

  return STATIC_PAGES.map((page) => ({
    ...page,
    url: `${getBaseUrl()}${page.url}`,
    lastModified,
  }))
}
