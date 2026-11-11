import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

import type { BasketEntry } from './basketTypes'

import { BASKET_ITEMS, BASKET_RECIPES } from './basketData'
import {
  bundleSavings,
  compareBundle,
  compareToWritten,
  computeBasket,
  costPerServing,
  describePurchase,
  groupBySection,
  pickDistinctBundles,
  rankBundles,
  recipeEntry,
  recipeShares,
  SECTION_ORDER,
  suggestAddition,
  toShoppingListText,
} from './basketMath'

const one = (slug: string): BasketEntry => recipeEntry(slug)
const NO_PANTRY = { includePantry: false }

describe('basket data', () => {
  it('matches a recipe for every basket entry', () => {
    BASKET_RECIPES.forEach(({ slug }) =>
      expect(
        existsSync(resolve(process.cwd(), 'content/recipes', `${slug}.json`)),
        slug
      ).toBe(true)
    )
  })

  it('prices every item a recipe uses', () => {
    BASKET_RECIPES.forEach(({ slug, lines }) =>
      Object.keys(lines).forEach((key) =>
        expect(BASKET_ITEMS[key], `${slug}: ${key}`).toBeDefined()
      )
    )
  })

  it('reproduces each recipe cost estimate per serving, to the cent', () => {
    BASKET_RECIPES.forEach(({ slug, perServingCost }) =>
      expect(costPerServing([one(slug)]), slug).toBeCloseTo(perServingCost, 2)
    )
  })
})

describe('computeBasket', () => {
  it('rounds up to whole packs once across recipes', () => {
    // Both recipes use part of a 16 oz tub of cottage cheese
    const chili = computeBasket([one('spicy-turkey-chili')], NO_PANTRY)
    const tacos = computeBasket([one('turkey-taco-grillers')], NO_PANTRY)
    const both = computeBasket(
      [one('spicy-turkey-chili'), one('turkey-taco-grillers')],
      NO_PANTRY
    )
    const tubs = (lines: typeof both.lines): number | undefined =>
      lines.find(({ key }) => key === 'cottage')?.packs

    expect(tubs(chili.lines)).toBe(1)
    expect(tubs(tacos.lines)).toBe(1)
    expect(tubs(both.lines)).toBe(1)
    expect(both.tripCost).toBeLessThan(chili.tripCost + tacos.tripCost)
  })

  it('prices items sold by weight exactly, with no leftover', () => {
    const { lines } = computeBasket(
      [one('blackened-chicken-alfredo')],
      NO_PANTRY
    )
    const chicken = lines.find(({ key }) => key === 'chicken_breast')

    expect(chicken?.packs).toBe(1.5)
    expect(chicken?.cost).toBeCloseTo(chicken?.proratedCost ?? 0)
    expect(chicken?.leftoverQuantity).toBe(0)
    expect(chicken && describePurchase(chicken)).toBe('1.5 lb')
  })

  it('describes packs, with a plain count for items sold one at a time', () => {
    const { lines } = computeBasket(
      [one('pollo-asado-chicken-thigh-bowl')],
      NO_PANTRY
    )
    const purchase = (key: string): string | undefined => {
      const line = lines.find((candidate) => candidate.key === key)
      return line && describePurchase(line)
    }

    expect(purchase('lime')).toBe('5')
    // 6 oz of cottage cheese: the 2-cup pack is the cheapest way to cover it
    expect(purchase('cottage')).toBe('1 × 2 × 5.3 oz cups')
  })

  it('prices each recipe from the smallest pack that covers it', () => {
    const tacos = computeBasket([one('turkey-taco-grillers')], NO_PANTRY)
    const cheddar = tacos.lines.find(({ key }) => key === 'cheddar')

    // 4 oz of the 8 oz block at $3.98
    expect(cheddar?.proratedCost).toBeCloseTo(1.99, 2)
    expect(cheddar && describePurchase(cheddar)).toBe('1 × 8 oz block')
  })

  it('skips a smaller pack that costs nearly as much as a bigger one', () => {
    const bake = computeBasket([one('cheesy-hash-brown-bacon-bake')], NO_PANTRY)
    const bacon = bake.lines.find(({ key }) => key === 'bacon')

    // 2 slices: the 12 oz pack is $4.44 and the 16 oz $4.49, so the 16 oz prices them
    expect(bacon?.proratedCost).toBeCloseTo((2 / 14) * 4.49, 2)
    // The register still buys whichever pack is cheaper
    expect(bacon?.cost).toBeCloseTo(4.44, 2)
  })

  it('buys the cheapest mix of sizes for pooled recipes', () => {
    // 6 oz of cottage cheese across the chili and tacos: the 2-cup pack beats two single cups
    const { lines } = computeBasket(
      [one('spicy-turkey-chili'), one('turkey-taco-grillers')],
      NO_PANTRY
    )
    const cottage = lines.find(({ key }) => key === 'cottage')

    expect(cottage?.quantity).toBeCloseTo(6)
    expect(cottage?.cost).toBeCloseTo(2.24, 2)
    expect(cottage && describePurchase(cottage)).toBe('1 × 2 × 5.3 oz cups')
  })

  it('scales by servings and counts them', () => {
    const single = computeBasket([one('spicy-turkey-chili')], NO_PANTRY)
    const double = computeBasket(
      [{ slug: 'spicy-turkey-chili', servings: single.servings * 2 }],
      NO_PANTRY
    )

    expect(double.servings).toBe(single.servings * 2)
    // Never more than twice the cost. A doubled amount can be priced from a bigger, cheaper pack.
    expect(double.proratedCost).toBeLessThanOrEqual(single.proratedCost * 2 + 1e-9)
    expect(double.proratedCost).toBeGreaterThan(single.proratedCost * 1.5)
  })

  it('leaves pantry staples out unless asked', () => {
    const without = computeBasket([one('blackened-chicken-alfredo')], NO_PANTRY)
    const withPantry = computeBasket([one('blackened-chicken-alfredo')], {
      includePantry: true,
    })

    expect(without.lines.some(({ item }) => item.pantry)).toBe(false)
    expect(withPantry.lines.some(({ item }) => item.pantry)).toBe(true)
  })

  it('ignores a slug with no basket data', () => {
    expect(computeBasket([one('not-a-recipe')], NO_PANTRY).lines).toEqual([])
  })

  it('splits the trip into what the recipes use and what is left over', () => {
    const totals = computeBasket([one('turkey-taco-grillers')], NO_PANTRY)

    expect(totals.tripCost).toBeCloseTo(
      totals.proratedCost + totals.leftoverCost
    )
    expect(totals.perishableLeftoverCost).toBeLessThanOrEqual(
      totals.leftoverCost
    )
  })
})

describe('bundles', () => {
  it('saves nothing for one recipe and something for two that share items', () => {
    expect(bundleSavings([one('spicy-turkey-chili')], NO_PANTRY)).toBe(0)
    expect(
      bundleSavings(
        [one('spicy-turkey-chili'), one('turkey-taco-grillers')],
        NO_PANTRY
      )
    ).toBeGreaterThan(0)
  })

  it('suggests a recipe not already in the basket', () => {
    const suggestion = suggestAddition([one('spicy-turkey-chili')], NO_PANTRY)

    expect(suggestion).toBeDefined()
    expect(suggestion?.slug).not.toBe('spicy-turkey-chili')
    expect(suggestion?.saving).toBeGreaterThan(0)
  })

  it('ranks bundles by saving and skips slugs with no data', () => {
    const ranked = rankBundles(
      ['spicy-turkey-chili', 'turkey-taco-grillers', 'beef-bulgogi', 'nope'],
      2,
      NO_PANTRY
    )

    expect(ranked).toHaveLength(3)
    expect(ranked.map(({ saving }) => saving)).toEqual(
      ranked.map(({ saving }) => saving).sort((a, b) => b - a)
    )
  })
})

describe('compareBundle', () => {
  it('prices a serving together and alone at the register, with the leftovers of each', () => {
    const pair = [one('spicy-turkey-chili'), one('turkey-taco-grillers')]
    const together = computeBasket(pair, NO_PANTRY)
    const alone =
      computeBasket([one('spicy-turkey-chili')], NO_PANTRY).tripCost +
      computeBasket([one('turkey-taco-grillers')], NO_PANTRY).tripCost
    const comparison = compareBundle(pair, NO_PANTRY)

    expect(comparison.togetherPerServing).toBeCloseTo(
      together.tripCost / together.servings
    )
    expect(comparison.alonePerServing).toBeCloseTo(alone / together.servings)
    expect(comparison.togetherPerServing).toBeLessThan(comparison.alonePerServing)
    expect(comparison.leftoverTogether).toBeLessThan(comparison.leftoverAlone)
    // Shares of what is used add up, so the saving is exactly the leftovers avoided
    expect(comparison.leftoverAlone - comparison.leftoverTogether).toBeCloseTo(
      bundleSavings(pair, NO_PANTRY)
    )
  })
})

describe('servings', () => {
  it('can lower the cost per serving by filling packs already bought', () => {
    // Doubled tacos fill the cheddar, cottage cheese, and corn they open. One extra serving
    // needs a second turkey tray, so it costs more per serving.
    const perServing = (servings: number): number => {
      const totals = computeBasket(
        [{ slug: 'turkey-taco-grillers', servings }],
        NO_PANTRY
      )
      return totals.tripCost / totals.servings
    }

    expect(perServing(8)).toBeLessThan(perServing(4))
    expect(perServing(5)).toBeGreaterThan(perServing(4))
  })
})

describe('compareToWritten', () => {
  it('counts cooking more as a saving against the recipe as written', () => {
    const tacos = recipeEntry('turkey-taco-grillers')
    const doubled = { ...tacos, servings: tacos.servings * 2 }
    const written = computeBasket([tacos], NO_PANTRY).tripCost

    const comparison = compareToWritten([doubled], NO_PANTRY)

    // Doubled tacos compare against buying the recipe twice as written
    expect(comparison.writtenCost).toBeCloseTo(written * 2)
    expect(comparison.saving).toBeCloseTo(
      written * 2 - computeBasket([doubled], NO_PANTRY).tripCost
    )
    expect(comparison.saving).toBeGreaterThan(0)
  })

  it('saves nothing for one recipe as written', () => {
    expect(
      compareToWritten([recipeEntry('spicy-turkey-chili')], NO_PANTRY).saving
    ).toBeCloseTo(0)
  })
})

describe('recipeShares', () => {
  it('splits the pooled trip so the parts add up and none costs more than alone', () => {
    const pair = [one('spicy-turkey-chili'), one('turkey-taco-grillers')]
    const shares = recipeShares(pair, NO_PANTRY)
    const together = computeBasket(pair, NO_PANTRY)
    const paid = pair.reduce((total, { slug }) => {
      const share = shares.get(slug)
      const servings = computeBasket([one(slug)], NO_PANTRY).servings
      return total + (share?.togetherPerServing ?? 0) * servings
    }, 0)

    expect(paid).toBeCloseTo(together.tripCost)

    pair.forEach(({ slug }) => {
      const share = shares.get(slug)

      expect(share?.togetherPerServing).toBeLessThan(share?.writtenPerServing ?? 0)
    })
  })
})

describe('pickDistinctBundles', () => {
  it('skips bundles that reuse a recipe already picked', () => {
    const ranked = [
      { slugs: ['a', 'b'], saving: 9 },
      { slugs: ['a', 'c'], saving: 8 },
      { slugs: ['c', 'd'], saving: 7 },
      { slugs: ['e', 'f'], saving: 6 },
    ]

    expect(pickDistinctBundles(ranked, 2).map(({ slugs }) => slugs)).toEqual([
      ['a', 'b'],
      ['c', 'd'],
    ])
  })
})

describe('shopping list', () => {
  it('groups lines by store section in walking order', () => {
    const { lines } = computeBasket([one('turkey-taco-grillers')], {
      includePantry: true,
    })
    const sections = groupBySection(lines).map(({ section }) => section)

    expect(sections).toEqual(
      SECTION_ORDER.filter((section) => sections.includes(section))
    )
  })

  it('writes plain text and leaves out checked items', () => {
    const { lines } = computeBasket(
      [one('blackened-chicken-alfredo')],
      NO_PANTRY
    )
    const text = toShoppingListText(lines, new Set(['pasta']))

    expect(text).toContain('Meat and seafood')
    expect(text).toContain('- Chicken breast, boneless skinless: 1.5 lb')
    expect(text).not.toContain('Pasta (Great Value)')
  })
})
