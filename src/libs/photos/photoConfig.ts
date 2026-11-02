import type { R2Config } from './r2Storage'

export type PhotoConfig = {
  openAiApiKey: string
  r2: R2Config
}

type PhotoEnv = {
  OPENAI_API_KEY?: string | undefined
  R2_ACCOUNT_ID?: string | undefined
  R2_ACCESS_KEY_ID?: string | undefined
  R2_SECRET_ACCESS_KEY?: string | undefined
  R2_BUCKET?: string | undefined
  R2_PUBLIC_URL?: string | undefined
}

// The photo step needs all six values. Returns the names that are missing so the caller can
// log them and skip, which is the normal state in dev and CI.
export const readPhotoConfig = (
  env: PhotoEnv
): { config: PhotoConfig } | { missing: string[] } => {
  const {
    OPENAI_API_KEY,
    R2_ACCOUNT_ID,
    R2_ACCESS_KEY_ID,
    R2_SECRET_ACCESS_KEY,
    R2_BUCKET,
    R2_PUBLIC_URL,
  } = env

  if (
    OPENAI_API_KEY &&
    R2_ACCOUNT_ID &&
    R2_ACCESS_KEY_ID &&
    R2_SECRET_ACCESS_KEY &&
    R2_BUCKET &&
    R2_PUBLIC_URL
  ) {
    return {
      config: {
        openAiApiKey: OPENAI_API_KEY,
        r2: {
          accountId: R2_ACCOUNT_ID,
          accessKeyId: R2_ACCESS_KEY_ID,
          secretAccessKey: R2_SECRET_ACCESS_KEY,
          bucket: R2_BUCKET,
          publicUrl: R2_PUBLIC_URL,
        },
      },
    }
  }

  const missing = Object.entries({
    OPENAI_API_KEY,
    R2_ACCOUNT_ID,
    R2_ACCESS_KEY_ID,
    R2_SECRET_ACCESS_KEY,
    R2_BUCKET,
    R2_PUBLIC_URL,
  })
    .filter(([, value]) => !value)
    .map(([name]) => name)
  return { missing }
}
