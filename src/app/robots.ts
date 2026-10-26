import type { MetadataRoute } from 'next'

import { getBaseUrl } from '@/utils/Env'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: '/profile/',
    },
    sitemap: `${getBaseUrl()}/sitemap.xml`,
  }
}
