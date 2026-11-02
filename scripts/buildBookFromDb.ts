// Writes the recipe book as markdown from the published recipes in the database, in the shape
// of docs/recipes.md (build/recipes-from-db.md). The pandoc and PDF path in buildBook.ts is
// unchanged and still reads docs/recipes.md. Prose (intro, reading guide, shopping and
// nutrition sections) is cut from docs/recipes.md; the recipes and quick reference table are
// generated. Run with `pnpm book:md:db`, or `pnpm book:md:db --from content/recipes` to render
// recipe JSON files instead of the database (no connection needed).
import 'reflect-metadata'
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { extname, join, resolve } from 'node:path'

import type { RecipeImport } from '@/validations'

import { closeDb, db } from '@/libs/DB'
import {
  numberBookRecipes,
  parseRecipesMarkdown,
  renderBookMarkdown,
  splitBookProse,
} from '@/libs/recipes'
import { RecipeRepository } from '@/libs/recipes/RecipeRepository'
import { recipeImportSchema } from '@/validations'

const ROOT = process.cwd()
const SOURCE = resolve(ROOT, 'docs/recipes.md')
const OUTPUT_DIR = resolve(ROOT, 'build')
const OUTPUT = resolve(OUTPUT_DIR, 'recipes-from-db.md')

const loadPublished = async (
  repository: RecipeRepository
): Promise<RecipeImport[]> => {
  const slugs = await repository.listPublishedSlugs()
  const recipes: RecipeImport[] = []
  for (const slug of slugs) {
    const id = await repository.getRecipeIdBySlug(slug)
    if (!id) continue
    const parsed = recipeImportSchema.safeParse(await repository.getRecipe(id))
    if (!parsed.success) {
      throw new Error(`"${slug}" does not match the import schema`)
    }
    recipes.push(parsed.data)
  }
  return recipes
}

const loadFromFiles = (folder: string): RecipeImport[] =>
  readdirSync(resolve(folder))
    .filter((name) => extname(name) === '.json')
    .sort()
    .map((name) => {
      const parsed = recipeImportSchema.safeParse(
        JSON.parse(readFileSync(join(resolve(folder), name), 'utf8'))
      )
      if (!parsed.success) throw new Error(`${name} does not match the schema`)
      return parsed.data
    })

const main = async (): Promise<void> => {
  const source = readFileSync(SOURCE, 'utf8')
  const args = process.argv.slice(2)
  const folder = args[args.indexOf('--from') + 1]
  const recipes =
    args.includes('--from') && folder
      ? loadFromFiles(folder)
      : await loadPublished(new RecipeRepository(db))
  if (recipes.length === 0) throw new Error('No published recipes found')

  // Recipes the book already lists keep their place
  const knownOrder = parseRecipesMarkdown(source).map(({ slug }) => slug)
  const markdown = renderBookMarkdown(
    numberBookRecipes(recipes, knownOrder),
    splitBookProse(source)
  )

  mkdirSync(OUTPUT_DIR, { recursive: true })
  writeFileSync(OUTPUT, markdown)
  console.log(`Wrote ${OUTPUT} (${recipes.length} recipes)`)
}

main()
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error)
    process.exitCode = 1
  })
  .finally(async () => {
    await closeDb()
  })
