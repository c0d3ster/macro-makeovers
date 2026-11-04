import { readdirSync } from 'node:fs'
import { extname, resolve } from 'node:path'

// Shared by the book build and the photo backfill. A recipe's photo lives in R2 at
// recipes/<slug>.jpg.
const RECIPE_DIR = resolve(process.cwd(), 'content/recipes')

// "## 10a. Southwest Sausage Hash Brown Bake | $$ · ~45 min · ●●○○○"
export const RECIPE_HEADING = /^## (\d+[a-z]?)\. (.+?) \| (.+)$/gm

export const photoKeyFor = (slug: string): string => `recipes/${slug}.jpg`

// Slugs of the seed recipes, from their JSON file names
export const seedSlugs = (): string[] =>
  readdirSync(RECIPE_DIR)
    .filter((name) => extname(name) === '.json')
    .map((name) => name.slice(0, -'.json'.length))
