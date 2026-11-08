// The guide list, kept apart from the file reading in guides.ts so client code (the site nav)
// can import it without pulling in node:fs.
export type GuideSlug = 'nutrition' | 'shopping' | 'reading-recipes'

type Guide = {
  slug: GuideSlug
  title: string
  // One sentence for the guide list and the page description
  description: string
}

export const GUIDES: Guide[] = [
  {
    slug: 'nutrition',
    title: 'Nutrition guide',
    description:
      'How protein, the fat floor, and carbs are set, and the C/F/P ratio for each goal.',
  },
  {
    slug: 'shopping',
    title: 'Shopping guide',
    description:
      'Lean proteins, the cottage cheese and Greek yogurt swaps, and which oil to cook with.',
  },
  {
    slug: 'reading-recipes',
    title: 'Reading a recipe',
    description:
      'What the cost, time, and difficulty marks mean, and how to use the nutrition table.',
  },
]

export const findGuide = (slug: string): Guide | undefined =>
  GUIDES.find((guide) => guide.slug === slug)
