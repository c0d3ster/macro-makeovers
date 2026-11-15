import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { BOOK_OBJECT_KEY, readBookBucket } from '@/libs/book'
import { putR2Object } from '@/libs/photos/r2Storage'

// Uploads build/macro-makeovers.pdf to the private R2 book bucket (R2_BOOK_BUCKET), where paid
// members download it through a signed link. Run after `pnpm book:pdf`; the book workflow does.
const PDF_PATH = resolve(process.cwd(), 'build/macro-makeovers.pdf')

const main = async (): Promise<void> => {
  const { R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BOOK_BUCKET } =
    process.env
  const result = readBookBucket({
    R2_ACCOUNT_ID,
    R2_ACCESS_KEY_ID,
    R2_SECRET_ACCESS_KEY,
    R2_BOOK_BUCKET,
  })
  if ('missing' in result) {
    throw new Error(`Cannot upload the book. Missing: ${result.missing.join(', ')}`)
  }

  const bytes = new Uint8Array(readFileSync(PDF_PATH))
  await putR2Object(result.bucket, BOOK_OBJECT_KEY, bytes, 'application/pdf')
  console.log(`Uploaded ${PDF_PATH} to ${result.bucket.bucket}/${BOOK_OBJECT_KEY}`)
}

main().catch((error: unknown) => {
  console.error(error)
  process.exitCode = 1
})
