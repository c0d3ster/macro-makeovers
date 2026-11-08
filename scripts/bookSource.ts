import { readdirSync, readFileSync } from 'node:fs'
import { extname, join, resolve } from 'node:path'

import type { BookProse, BookRecipe } from '@/libs/recipes'
import type { RecipeImport } from '@/validations'

import { db } from '@/libs/DB'
import { loadBookGuideProse } from '@/libs/guides'
import { numberBookRecipes } from '@/libs/recipes'
import { RecipeRepository } from '@/libs/recipes/RecipeRepository'
import { recipeImportSchema } from '@/validations'

// Where the printable book comes from: the published recipes (database, or a folder of recipe
// JSON with `--from <folder>`), plus the hand-written prose and recipe order in content/book and
// the guide prose in content/guides.
const BOOK_DIR = resolve(process.cwd(), 'content/book')

const loadPublishedRecipes = async (
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

const loadRecipeFiles = (folder: string): RecipeImport[] =>
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

const readBookFile = (name: string): string =>
  readFileSync(join(BOOK_DIR, name), 'utf8').trim()

// The reading guide and closing sections come from content/guides, shared with the site pages
export const loadBookProse = (): BookProse => ({
  intro: readBookFile('intro.md'),
  ...loadBookGuideProse(),
})

// Recipes in the book keep the order listed in content/book/order.json. Newer ones follow A to Z.
const numberRecipes = (recipes: RecipeImport[]): BookRecipe[] => {
  const order: unknown = JSON.parse(readBookFile('order.json'))
  const knownOrder = Array.isArray(order)
    ? order.filter((slug): slug is string => typeof slug === 'string')
    : []
  if (recipes.length === 0) throw new Error('No published recipes found')
  return numberBookRecipes(recipes, knownOrder)
}

// Each recipe's chosen photo by slug. A `--from` build has no database to ask.
export const loadBookPhotoUrls = (
  args: string[]
): Promise<Map<string, string>> =>
  args.includes('--from')
    ? Promise.resolve(new Map())
    : new RecipeRepository(db).listPublishedImageUrls()

// The numbered book recipes for the command line: `--from <folder>` reads recipe JSON files with
// no database, otherwise the published recipes in the database.
export const loadBookRecipes = async (
  args: string[]
): Promise<BookRecipe[]> => {
  const flag = args.indexOf('--from')
  const folder = flag === -1 ? undefined : args[flag + 1]
  if (flag !== -1 && !folder) throw new Error('--from needs a folder')
  const recipes = folder
    ? loadRecipeFiles(folder)
    : await loadPublishedRecipes(new RecipeRepository(db))
  return numberRecipes(recipes)
}
