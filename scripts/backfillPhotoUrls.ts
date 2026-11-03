import 'reflect-metadata'

import { closeDb, db } from '@/libs/DB'
import { Env } from '@/libs/Env'
import { RecipeRepository } from '@/libs/recipes/RecipeRepository'

import { photoKeyFor, slugsByTitle } from './bookPhotos'

// Points each recipe's image_url at its original photo in Cloudflare R2 (recipes/<slug>.jpg),
// only while the recipe has none and the object really exists, so nothing is overwritten.
// The photos were uploaded to the shared bucket once, so this just fills in the database.
// Run with `pnpm photos:backfill` (local database) or `pnpm photos:backfill:prod` (hosted).
const main = async (): Promise<void> => {
  const { R2_PUBLIC_URL } = Env
  if (!R2_PUBLIC_URL) throw new Error('Set R2_PUBLIC_URL')

  const repository = new RecipeRepository(db)
  for (const slug of [...slugsByTitle().values()].sort()) {
    const url = `${R2_PUBLIC_URL.replace(/\/+$/, '')}/${photoKeyFor(slug)}`
    const head = await fetch(url, { method: 'HEAD' })
    if (!head.ok) {
      console.warn(`${slug}: no photo in R2 (${head.status}), skipped`)
      continue
    }

    const id = await repository.getRecipeIdBySlug(slug)
    if (!id) {
      console.log(`${slug}: not in the database`)
      continue
    }
    const saved = await repository.setPlaceholderImage(id, url)
    console.log(`${slug}: ${saved ? 'image_url set' : 'image_url already set'}`)
  }
}

main()
  .catch((error: unknown) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(closeDb)
