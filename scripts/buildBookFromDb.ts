// Writes the recipe book as markdown from the published recipes in the database
// (build/recipes-from-db.md). `pnpm book:pdf` builds the PDF from the same source. Prose (intro,
// reading guide, shopping and nutrition sections) and the recipe order live in content/book; the
// recipes and quick reference table are generated. Run with `pnpm book:md:db`, or
// `pnpm book:md:db --from content/recipes` to render recipe JSON files instead of the database
// (no connection needed).
import 'reflect-metadata'
import { mkdirSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { closeDb } from '@/libs/DB'
import { renderBookMarkdown } from '@/libs/recipes'

import { loadBookProse, loadBookRecipes } from './bookSource'

const OUTPUT_DIR = resolve(process.cwd(), 'build')
const OUTPUT = resolve(OUTPUT_DIR, 'recipes-from-db.md')

const main = async (): Promise<void> => {
  const recipes = await loadBookRecipes(process.argv.slice(2))
  const markdown = renderBookMarkdown(recipes, loadBookProse())

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
