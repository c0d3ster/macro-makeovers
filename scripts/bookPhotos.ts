import { readdirSync, readFileSync } from 'node:fs'
import { extname, resolve } from 'node:path'

import { recipeImportSchema } from '@/validations'

// Shared by the book build and the photo upload. A recipe's original photo lives in R2 at
// recipes/<slug>.jpg; the book only knows a recipe by the title printed in its heading.
const RECIPE_DIR = resolve(process.cwd(), 'content/recipes')

// "## 10a. Southwest Sausage Hash Brown Bake | $$ · ~45 min · ●●○○○"
export const RECIPE_HEADING = /^## (\d+[a-z]?)\. (.+?) \| (.+)$/gm

export const photoKeyFor = (slug: string): string => `recipes/${slug}.jpg`

// "Turkey Taco Grillers (or lean beef)" prints a suffix the recipe title does not have
const normalizeTitle = (title: string): string =>
  title
    .replace(/\s*\(.*\)\s*$/, '')
    .trim()
    .toLowerCase()

// Book heading title to recipe slug, read from the recipe JSON files
export const slugsByTitle = (): Map<string, string> =>
  new Map(
    readdirSync(RECIPE_DIR)
      .filter((name) => extname(name) === '.json')
      .map((name): [string, string] => {
        const { title, slug } = recipeImportSchema.parse(
          JSON.parse(readFileSync(resolve(RECIPE_DIR, name), 'utf8'))
        )
        return [normalizeTitle(title), slug]
      })
  )

export const slugForHeadingTitle = (
  slugs: Map<string, string>,
  title: string
): string | undefined => slugs.get(normalizeTitle(title))
