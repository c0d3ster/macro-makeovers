import type { R2Bucket } from '@/libs/photos/r2Storage'

// Where the book lives in the private bucket, and the name it downloads as
export const BOOK_OBJECT_KEY = 'macro-makeovers.pdf'
export const BOOK_DOWNLOAD_NAME = 'macro-makeovers.pdf'
// Long enough to start a download, short enough that a shared link goes stale fast
export const BOOK_LINK_SECONDS = 300

type BookEnv = {
  R2_ACCOUNT_ID?: string | undefined
  R2_ACCESS_KEY_ID?: string | undefined
  R2_SECRET_ACCESS_KEY?: string | undefined
  R2_BOOK_BUCKET?: string | undefined
}

// The private book bucket shares the photo account and keys. Returns the missing names when
// any value is unset.
export const readBookBucket = ({
  R2_ACCOUNT_ID,
  R2_ACCESS_KEY_ID,
  R2_SECRET_ACCESS_KEY,
  R2_BOOK_BUCKET,
}: BookEnv): { bucket: R2Bucket } | { missing: string[] } => {
  if (R2_ACCOUNT_ID && R2_ACCESS_KEY_ID && R2_SECRET_ACCESS_KEY && R2_BOOK_BUCKET) {
    return {
      bucket: {
        accountId: R2_ACCOUNT_ID,
        accessKeyId: R2_ACCESS_KEY_ID,
        secretAccessKey: R2_SECRET_ACCESS_KEY,
        bucket: R2_BOOK_BUCKET,
      },
    }
  }

  const missing = Object.entries({
    R2_ACCOUNT_ID,
    R2_ACCESS_KEY_ID,
    R2_SECRET_ACCESS_KEY,
    R2_BOOK_BUCKET,
  })
    .filter(([, value]) => !value)
    .map(([name]) => name)
  return { missing }
}
