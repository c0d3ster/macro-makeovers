import { describe, expect, it } from 'vitest'

import type { RecipeCardRow } from './recipeCards'
import type { RecipeBuildRow } from './recipeDetail'

import { toCardSummary, toRecipeCard } from './recipeCards'

const buildRow = (
  overrides: Partial<RecipeBuildRow> = {}
): RecipeBuildRow => ({
  position: 0,
  key: 'base',
  label: 'Base only',
  isDefault: false,
  listed: true,
  calories: 370,
  carbsG: 42,
  fatG: 8,
  proteinG: 32,
  swap: {},
  title: null,
  noteMd: null,
  costTier: null,
  difficulty: null,
  prepMinutes: null,
  cookMinutes: null,
  imageUrl: null,
  ...overrides,
})

const row: RecipeCardRow = {
  slug: 'test-chili',
  title: 'Test Chili',
  summary: 'A test recipe',
  servings: 5,
  prepMinutes: 15,
  cookMinutes: 55,
  costTier: 1,
  difficulty: 2,
  imageUrl: null,
  builds: [
    buildRow(),
    buildRow({
      position: 1,
      key: 'loaded',
      label: 'Fully loaded',
      isDefault: true,
      calories: 500,
      carbsG: 52,
      fatG: 15,
      proteinG: 39,
    }),
  ],
  nutrition: [
    {
      kind: 'traditional',
      calories: 480,
      carbsG: 30,
      fatG: 28,
      proteinG: 27,
    },
  ],
  recipeTags: [{ tag: { name: 'turkey' } }, { tag: { name: 'chili' } }],
}

describe('toRecipeCard', () => {
  it('uses the default build for the macros', () => {
    expect(toRecipeCard(row)).toMatchObject({
      calories: 500,
      proteinG: 39,
      carbsG: 52,
      fatG: 15,
      build: { key: 'loaded', isDefault: true },
    })
  })

  it('carries the traditional row as the original macros', () => {
    expect(toRecipeCard(row)?.original).toEqual({
      proteinG: 27,
      carbsG: 30,
      fatG: 28,
    })
  })

  it('has no original macros without a traditional row', () => {
    expect(toRecipeCard({ ...row, nutrition: [] })?.original).toBeUndefined()
  })

  it('adds prep and cook time and sorts the tags', () => {
    expect(toRecipeCard(row)).toMatchObject({
      totalMinutes: 70,
      tags: ['chili', 'turkey'],
    })
  })

  it('falls back to the first build when none is flagged', () => {
    const unflagged: RecipeCardRow = {
      ...row,
      builds: row.builds.map((item) => ({ ...item, isDefault: false })),
    }

    expect(toRecipeCard(unflagged)?.calories).toBe(370)
  })

  it('has no card without a build', () => {
    expect(toRecipeCard({ ...row, builds: [] })).toBeUndefined()
  })

  it('applies each build override to its card build, falling back to the recipe', () => {
    const card = toRecipeCard({
      ...row,
      builds: [
        ...row.builds,
        buildRow({
          position: 2,
          key: 'beef',
          label: 'Beef',
          swap: { turkey: 'beef' },
          costTier: 3,
          prepMinutes: 5,
          imageUrl: 'https://example.com/beef.jpg',
        }),
      ],
    })
    const beef = card?.builds.find(({ key }) => key === 'beef')

    // "Test Chili" has no turkey in it, so the swap leaves the title alone
    expect(beef).toMatchObject({
      title: 'Test Chili',
      summary: 'A test recipe',
      costTier: 3,
      totalMinutes: 60,
      difficulty: 2,
      tags: ['beef', 'chili'],
      imageUrl: 'https://example.com/beef.jpg',
    })
    expect(card?.title).toBe('Test Chili')
  })
})

describe('toRecipeCard photo', () => {
  it('has no photo when the recipe has no image_url', () => {
    expect(toRecipeCard({ ...row, imageUrl: null })?.imageUrl).toBeUndefined()
  })

  it('uses the recipe image_url', () => {
    const card = toRecipeCard({
      ...row,
      imageUrl: 'https://example.com/chili.jpg',
    })

    expect(card?.imageUrl).toBe('https://example.com/chili.jpg')
  })
})

describe('toCardSummary', () => {
  it('keeps just the first sentence', () => {
    expect(
      toCardSummary(
        'Lean turkey lacks the fat and richness beef brings, so you build it back. Big batch.'
      )
    ).toBe(
      'Lean turkey lacks the fat and richness beef brings, so you build it back.'
    )
  })

  it('keeps a short first sentence on its own', () => {
    expect(
      toCardSummary('Classic casserole, rebuilt. No cream of chicken soup.')
    ).toBe('Classic casserole, rebuilt.')
  })

  it('does not split on a decimal point', () => {
    expect(
      toCardSummary(
        'Uses 1.5 lb of beef and a long marinade for deep flavor. Second.'
      )
    ).toBe('Uses 1.5 lb of beef and a long marinade for deep flavor.')
  })

  it('returns text without a sentence end as is', () => {
    expect(toCardSummary('No punctuation here')).toBe('No punctuation here')
  })

  it('returns a short single sentence as is', () => {
    expect(toCardSummary('Short one.')).toBe('Short one.')
  })
})
