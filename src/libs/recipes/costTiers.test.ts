import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { z } from 'zod'

import { parseRecipesMarkdown } from './parseRecipesMarkdown'

const basketSchema = z.object({
  recipes: z.array(
    z.object({
      id: z.string(),
      slug: z.string(),
      perServingCost: z.number(),
      alternateOf: z.string().optional(),
    })
  ),
})

const read = (path: string): string =>
  readFileSync(resolve(process.cwd(), path), 'utf8')

const basket = basketSchema.parse(JSON.parse(read('docs/basket-data.json')))
const recipes = parseRecipesMarkdown(read('docs/recipes.md'))

// Bands from docs/cost-estimates.md, per serving: $ under 3, $$ under 5, $$$ under 7, $$$$ under 10
const tierFor = (perServing: number): number =>
  [3, 5, 7, 10].findIndex((limit) => perServing < limit) + 1

describe('recipe cost tiers vs docs/basket-data.json', () => {
  it('prices every recipe in the book', () => {
    const priced = new Set(basket.recipes.map(({ slug }) => slug))

    expect(
      recipes.map(({ slug }) => slug).filter((s) => !priced.has(s))
    ).toEqual([])
  })

  it.each(recipes.map(({ slug }) => slug))(
    '%s tier matches its priced builds',
    (slug) => {
      const tiers = basket.recipes
        .filter((recipe) => recipe.slug === slug)
        .map(({ perServingCost }) => tierFor(perServingCost))
      const recipe = recipes.find((item) => item.slug === slug)

      expect(recipe?.costTier).toBe(Math.min(...tiers))
      expect(recipe?.costTierMax).toBe(
        Math.max(...tiers) > Math.min(...tiers) ? Math.max(...tiers) : undefined
      )
    }
  )
})
