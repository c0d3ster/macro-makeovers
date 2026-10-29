import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { z } from 'zod'

import { parseRecipesMarkdown } from './parseRecipesMarkdown'

const basketSchema = z.object({
  recipes: z.array(
    z.object({
      slug: z.string(),
      perServingCost: z.number(),
      variantOf: z.string().optional(),
    })
  ),
})

const read = (path: string): string =>
  readFileSync(resolve(process.cwd(), path), 'utf8')

const basket = basketSchema.parse(JSON.parse(read('docs/basket-data.json')))
const recipes = parseRecipesMarkdown(read('docs/recipes.md'))

// In the book but not costed yet (docs/cost-estimates.md predates them)
const UNPRICED = ['southwest-sausage-hash-brown-bake']

// Bands from docs/cost-estimates.md, per serving: $ under 3, $$ under 5, $$$ under 7, $$$$ under 10
const tierFor = (perServing: number): number =>
  [3, 5, 7, 10].findIndex((limit) => perServing < limit) + 1

describe('recipe cost tiers vs docs/basket-data.json', () => {
  it('prices every recipe in the book that has been costed', () => {
    const priced = new Set(basket.recipes.map(({ slug }) => slug))
    const missing = recipes
      .map(({ slug }) => slug)
      .filter((slug) => !priced.has(slug) && !UNPRICED.includes(slug))

    expect(missing).toEqual([])
  })

  it.each(
    basket.recipes.filter(({ slug }) => recipes.some((r) => r.slug === slug))
  )('$slug tier matches its per-serving cost', ({ slug, perServingCost }) => {
    expect(recipes.find((recipe) => recipe.slug === slug)?.costTier).toBe(
      tierFor(perServingCost)
    )
  })
})
