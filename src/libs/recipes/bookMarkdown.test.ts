import { describe, expect, it } from 'vitest'

import { sampleRecipe } from '@/tests/fixtures/recipe'
import { recipeImportSchema } from '@/validations'

import { numberBookRecipes, renderBookMarkdown } from './bookMarkdown'

const salsa = recipeImportSchema.parse({
  ...sampleRecipe,
  slug: 'mango-salsa',
  title: 'Mango Salsa',
  course: 'sauce',
  ingredients: [{ raw: '1.5 cups mango, diced' }],
  steps: [{ phase: 'prep', body: 'Toss the salsa together' }],
})
const bowl = recipeImportSchema.parse({
  ...sampleRecipe,
  slug: 'chicken-bowl',
  title: 'Chicken Bowl',
  components: [{ slug: 'mango-salsa', amount: '1/2 cup per bowl' }],
})
const lonely = recipeImportSchema.parse({
  ...sampleRecipe,
  slug: 'lonely-sauce',
  title: 'Lonely Sauce',
  course: 'sauce',
})

const prose = { intro: 'All two numbered recipes', guide: '', outro: '' }

describe('numberBookRecipes with components', () => {
  it('prints a used component inside its dish, and an unused one on its own', () => {
    const book = numberBookRecipes([salsa, bowl, lonely], [])

    expect(book.map(({ recipe }) => recipe.slug)).toEqual([
      'chicken-bowl',
      'lonely-sauce',
    ])
    expect(book[0]?.components?.map(({ recipe }) => recipe.slug)).toEqual([
      'mango-salsa',
    ])
  })

  it('says what a sauce makes and what a serving is', () => {
    const sauce = { ...lonely, servingSize: '1/2 cup', makes: '2.5 cups' }
    const markdown = renderBookMarkdown(numberBookRecipes([sauce], []), prose)

    expect(markdown).toContain('**Makes ~4 servings (2.5 cups, 1/2 cup each).**')
  })

  it('lists the component lines and steps in the dish', () => {
    const markdown = renderBookMarkdown(numberBookRecipes([salsa, bowl], []), prose)

    expect(markdown).toContain('**Mango Salsa** (1/2 cup per bowl)')
    expect(markdown).toContain('- 1.5 cups mango, diced')
    expect(markdown).toContain('- Toss the salsa together')
  })
})
