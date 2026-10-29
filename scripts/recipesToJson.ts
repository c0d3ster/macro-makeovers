// Converts the recipe book (docs/recipes.md) into one import-ready JSON file per recipe.
// Run with `pnpm recipe:parse`, then review the files in content/recipes and import them
// with `pnpm recipe:import content/recipes`.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { parseRecipesMarkdown } from '@/libs/recipes'
import { recipeImportSchema } from '@/validations'

const SOURCE = resolve(process.cwd(), 'docs/recipes.md')
const OUTPUT_DIR = resolve(process.cwd(), 'content/recipes')

// Tags are not in the book, so they are assigned here by recipe. Edit freely.
const tagsBySlug: Record<string, string[]> = {
  'blackened-chicken-alfredo': [
    'pasta',
    'chicken',
    'stovetop',
    'blender',
    'high protein',
    'comfort food',
    'batch friendly',
  ],
  'spicy-turkey-chili': [
    'chili',
    'turkey',
    'stovetop',
    'high protein',
    'freezer friendly',
    'batch friendly',
    'comfort food',
  ],
  'turkey-taco-grillers': [
    'turkey',
    'beef',
    'bowl',
    'stovetop',
    'high protein',
    'batch friendly',
  ],
  'ham-and-prosciutto-sliders': [
    'sandwich',
    'pork',
    'oven',
    'quick',
    'high protein',
  ],
  'greek-yogurt-tuna-melt': [
    'sandwich',
    'seafood',
    'broiler',
    'quick',
    'high protein',
  ],
  'cheesy-chicken-and-broccoli-rice-bake': [
    'bake',
    'chicken',
    'rice',
    'oven',
    'sheet pan',
    'blender',
    'high protein',
    'batch friendly',
    'comfort food',
  ],
  'lemon-pepper-shrimp-pesto-linguine': [
    'pasta',
    'seafood',
    'stovetop',
    'high protein',
    'batch friendly',
  ],
  'kickin-fried-chicken': [
    'chicken',
    'air fryer',
    'high protein',
    'comfort food',
  ],
  'beef-bulgogi': [
    'beef',
    'rice',
    'stovetop',
    'high protein',
    'batch friendly',
  ],
  'cheesy-hash-brown-bacon-bake': [
    'bake',
    'pork',
    'oven',
    'sheet pan',
    'high protein',
    'comfort food',
  ],
  'southwest-sausage-hash-brown-bake': [
    'bake',
    'pork',
    'oven',
    'sheet pan',
    'high protein',
    'comfort food',
  ],
  'red-enchilada-casserole': [
    'bake',
    'chicken',
    'oven',
    'high protein',
    'batch friendly',
    'freezer friendly',
  ],
  'pollo-asado-chicken-thigh-bowl': [
    'bowl',
    'chicken',
    'rice',
    'stovetop',
    'high protein',
    'batch friendly',
  ],
  'shake-n-bake-pork-chops': [
    'pork',
    'air fryer',
    'sheet pan',
    'high protein',
    'comfort food',
  ],
}

const main = (): void => {
  const parsed = parseRecipesMarkdown(readFileSync(SOURCE, 'utf8'))
  mkdirSync(OUTPUT_DIR, { recursive: true })

  parsed.forEach((recipe) => {
    const tags = tagsBySlug[recipe.slug]
    if (!tags) throw new Error(`No tags listed for "${recipe.slug}"`)

    const withTags = { ...recipe, tags }
    const check = recipeImportSchema.safeParse(withTags)
    if (!check.success) {
      throw new Error(`${recipe.slug} is not valid: ${check.error.message}`)
    }

    writeFileSync(
      resolve(OUTPUT_DIR, `${recipe.slug}.json`),
      `${JSON.stringify(withTags, null, 2)}\n`
    )
    console.log(
      `${recipe.slug.padEnd(40)} ${recipe.ingredients.length} ingredients, ` +
        `${recipe.steps.length} steps, ${recipe.notes.length} notes, ` +
        `${recipe.nutrition.length} nutrition rows`
    )
  })

  console.log(`\nWrote ${parsed.length} recipes to content/recipes`)
}

main()
