import { Env } from '@/libs/Env'
import { logger } from '@/libs/Logger'

import type { PhotoRecipe } from './placeholderPhoto'

import { generateOpenAiImage } from './openAiImage'
import { toWebJpeg } from './optimizeImage'
import { readPhotoConfig } from './photoConfig'
import { createPlaceholderPhoto } from './placeholderPhoto'
import { uploadToR2 } from './r2Storage'

type PhotoWriter = {
  setPlaceholderImage: (id: string, url: string) => Promise<boolean>
}

// Wires the real OpenAI, R2 and database calls into the photo step. Never throws: with
// secrets missing it logs and skips, and any failure is logged, so the import is unaffected.
export const addPlaceholderPhoto = async (
  writer: PhotoWriter,
  recipe: PhotoRecipe,
  env: Parameters<typeof readPhotoConfig>[0] = Env
): Promise<void> => {
  const settings = readPhotoConfig(env)
  if ('missing' in settings) {
    logger.info('Skipping placeholder photo, photo env is not set', {
      slug: recipe.slug,
      missing: settings.missing,
    })
    return
  }

  const { config } = settings
  try {
    const outcome = await createPlaceholderPhoto(
      {
        generateImage: (prompt) =>
          generateOpenAiImage(config.openAiApiKey, prompt),
        optimizeImage: toWebJpeg,
        uploadImage: (key, bytes) => uploadToR2(config.r2, key, bytes),
        saveImageUrl: writer.setPlaceholderImage,
      },
      recipe
    )
    logger.info('Placeholder photo step finished', {
      slug: recipe.slug,
      outcome,
    })
  } catch (error) {
    logger.error('Placeholder photo failed', {
      slug: recipe.slug,
      error: String(error),
    })
  }
}
