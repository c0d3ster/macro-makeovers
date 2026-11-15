// The legal page list, kept apart from the file reading in legalPages.ts so client code (the
// site footer) can import it without pulling in node:fs.
export type LegalSlug = 'nutrition-disclaimer' | 'privacy' | 'terms' | 'refunds'

type LegalPage = {
  slug: LegalSlug
  title: string
  // The footer link, shorter than the title where it helps
  label: string
  // One sentence for the page description
  description: string
  // ISO date the page last changed in a way that matters
  updated: string
}

export const LEGAL_PAGES: LegalPage[] = [
  {
    slug: 'nutrition-disclaimer',
    title: 'Nutrition disclaimer',
    label: 'Nutrition disclaimer',
    description:
      'How the calorie, carb, fat, and protein numbers are estimated, and why they are not medical advice.',
    updated: '2026-11-15',
  },
  {
    slug: 'privacy',
    title: 'Privacy policy',
    label: 'Privacy',
    description:
      'What we collect, why, and the services that help run the site.',
    updated: '2026-11-15',
  },
  {
    slug: 'terms',
    title: 'Terms of service',
    label: 'Terms',
    description:
      'The rules for using the site, the paid plan, and grocery partner handoffs.',
    updated: '2026-11-15',
  },
  {
    slug: 'refunds',
    title: 'Refund policy',
    label: 'Refunds',
    description: 'Canceling the paid plan and when we refund a charge.',
    updated: '2026-11-15',
  },
]

export const findLegalPage = (slug: LegalSlug): LegalPage => {
  const page = LEGAL_PAGES.find((legal) => legal.slug === slug)
  if (!page) throw new Error(`Unknown legal page: ${slug}`)
  return page
}
