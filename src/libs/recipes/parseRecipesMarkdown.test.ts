import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

import { recipeImportSchema } from '@/validations'

import { parseRecipesMarkdown } from './parseRecipesMarkdown'

const markdown = readFileSync(resolve(process.cwd(), 'docs/recipes.md'), 'utf8')
const recipes = parseRecipesMarkdown(markdown)

const bySlug = (slug: string): (typeof recipes)[number] => {
  const recipe = recipes.find((item) => item.slug === slug)
  if (!recipe) throw new Error(`No recipe with slug ${slug}`)
  return recipe
}

describe('parseRecipesMarkdown (docs/recipes.md)', () => {
  it('finds all thirteen recipes with unique slugs', () => {
    expect(recipes).toHaveLength(13)
    expect(new Set(recipes.map(({ slug }) => slug)).size).toBe(13)
  })

  it('produces recipes that pass the import schema', () => {
    recipes.forEach((recipe) => {
      const result = recipeImportSchema.safeParse({ ...recipe, tags: [] })

      expect(
        result.success,
        `${recipe.slug}: ${result.success ? '' : result.error.message}`
      ).toBe(true)
    })
  })

  it('reads the header, servings, and times', () => {
    expect(bySlug('blackened-chicken-alfredo')).toMatchObject({
      title: 'Blackened Chicken Alfredo',
      servings: 6,
      costTier: 1,
      difficulty: 4,
      prepMinutes: 10,
      cookMinutes: 25,
    })
    expect(bySlug('kickin-fried-chicken').difficulty).toBe(5)
    expect(bySlug('ham-and-prosciutto-sliders').costTier).toBe(3)
    expect(bySlug('ham-and-prosciutto-sliders').costTierMax).toBeUndefined()
  })

  it('reads a cost range when the builds are priced differently', () => {
    expect(bySlug('beef-bulgogi')).toMatchObject({
      costTier: 3,
      costTierMax: 4,
    })
    expect(bySlug('pollo-asado-chicken-thigh-bowl')).toMatchObject({
      costTier: 2,
      costTierMax: 3,
    })
  })

  it('uses the quick reference title and slug for renamed headings', () => {
    expect(bySlug('turkey-taco-grillers').title).toBe('Turkey Taco Grillers')
  })

  it('keeps per-serving makeover rows and the traditional row, not batch totals', () => {
    const alfredo = bySlug('blackened-chicken-alfredo').nutrition

    expect(alfredo).toEqual([
      {
        kind: 'makeover',
        label: 'Per serving',
        calories: 625,
        carbsG: 63,
        fatG: 18,
        proteinG: 52,
        isDefault: true,
      },
      {
        kind: 'traditional',
        label: 'Traditional per serving',
        calories: 805,
        carbsG: 48,
        fatG: 55,
        proteinG: 30,
        isDefault: false,
      },
    ])
  })

  it('features the build the quick reference lists', () => {
    const labels = (slug: string): string[] =>
      bySlug(slug)
        .nutrition
.filter(({ isDefault }) => isDefault)
        .map(({ label }) => label)

    expect(labels('spicy-turkey-chili')).toEqual(['Fully loaded'])
    expect(labels('pollo-asado-chicken-thigh-bowl')).toEqual(['Skinless'])
    expect(labels('greek-yogurt-tuna-melt')).toEqual([
      'Melt on hoagie roll (default)',
    ])
  })

  it('drops the per-slider row as a duplicate unit view', () => {
    const labels = bySlug('ham-and-prosciutto-sliders').nutrition.map(
      ({ label }) => label
    )

    expect(labels).toHaveLength(3)
    expect(labels.some((label) => /per slider/i.test(label))).toBe(false)
  })

  it('groups ingredients under their bold headings', () => {
    const alfredo = bySlug('blackened-chicken-alfredo').ingredients

    expect(alfredo[0]).toEqual({
      group: 'Sauce',
      raw: '16oz (2 cups) 2% cottage cheese, cold',
    })
    expect(alfredo.at(-1)?.group).toBe('Rest of dish')
  })

  it('treats a bold label with a trailing note as an ingredient group', () => {
    const groups = new Set(
      bySlug('greek-yogurt-tuna-melt').ingredients.map(({ group }) => group)
    )

    expect(groups).toContain('Per sandwich (pick a build)')
    expect(groups).toContain('Salad (makes 4)')
  })

  it('splits prep bullets and numbered cook steps', () => {
    const { steps } = bySlug('blackened-chicken-alfredo')

    expect(steps.filter(({ phase }) => phase === 'prep')).toHaveLength(4)
    expect(steps.filter(({ phase }) => phase === 'cook')).toHaveLength(7)
    expect(steps[0]).toEqual({
      phase: 'prep',
      body: 'Mince the garlic, dice the onion if using.',
    })
  })

  it('keeps build sub-sections inside the step they belong to', () => {
    const cookSteps = bySlug('pollo-asado-chicken-thigh-bowl').steps.filter(
      ({ phase }) => phase === 'cook'
    )

    expect(cookSteps[1]?.body).toContain('Cook the chicken for your build:')
    expect(cookSteps[1]?.body).toContain('**Skinless**')
    expect(cookSteps[1]?.body).toContain('**Skin-on**')
    expect(cookSteps[2]?.body).toMatch(/^Warm the black beans/)
  })

  it('turns make-or-break and fixes bullets into one note each', () => {
    const { notes } = bySlug('blackened-chicken-alfredo')

    expect(notes.filter(({ kind }) => kind === 'make_or_break')).toHaveLength(5)
    expect(notes.filter(({ kind }) => kind === 'fixes')).toHaveLength(4)
  })

  it('keeps ingredient callouts as tips', () => {
    const { notes } = bySlug('blackened-chicken-alfredo')

    expect(notes.find(({ kind }) => kind === 'tip')?.body).toMatch(
      /^Chicken fat note:/
    )
  })

  it('keeps extra sections as levers so no text is lost', () => {
    const taco = bySlug('turkey-taco-grillers').notes
    const bodies = taco
      .filter(({ kind }) => kind === 'levers')
      .map((note) => note.body)

    expect(
      bodies.some((body) => body.startsWith('**Spicy Charred Corn Pico**'))
    ).toBe(true)
    expect(bodies.some((body) => body.startsWith('**Meat options'))).toBe(true)
  })

  it('fails loudly when the quick reference disagrees with a recipe table', () => {
    const broken = markdown.replace(
      /(\[Blackened Chicken Alfredo\]\([^)]*\)\s*\|\s*)~625/,
      '$1~999'
    )

    expect(broken).not.toBe(markdown)

    expect(() => parseRecipesMarkdown(broken)).toThrow(
      /Blackened Chicken Alfredo/
    )
  })
})
