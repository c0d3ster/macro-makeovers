import type { NextRequest } from 'next/server'

import { NextResponse } from 'next/server'

import type { PhotoResponse } from '@/validations'

import { Env } from '@/libs/Env'
import { logger } from '@/libs/Logger'
import {
  createPhotoCandidate,
  editOpenAiImage,
  generateOpenAiImage,
  readPhotoConfig,
  toWebJpeg,
  uploadToR2,
} from '@/libs/photos'
import {
  formFile,
  formText,
  isOurPhoto,
  missingPhotoConfig,
  photoFailure,
  photoFileProblem,
} from '@/libs/photos/photoRouteHelpers'
import { isOwner } from '@/libs/supabase/owner'
import { photoRequestSchema } from '@/validations'

// Image generation can take a couple of minutes
export const maxDuration = 300

const fetchSourcePhoto = async (url: string): Promise<File> => {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Could not read the photo (${response.status})`)
  }
  return new File([await response.arrayBuffer()], 'source.jpg', {
    type: 'image/jpeg',
  })
}

// Generates a candidate photo from what is on screen, saved or not, so a new recipe can have one
// before its first save. The reference photo is passed through to OpenAI and never stored.
// Nothing changes on a recipe until a candidate is chosen.
export const POST = async (
  request: NextRequest
): Promise<NextResponse<PhotoResponse>> => {
  if (!(await isOwner())) {
    return photoFailure(
      'request',
      'Only the site owner can generate photos.',
      403
    )
  }

  const settings = readPhotoConfig(Env)
  if ('missing' in settings) return missingPhotoConfig(settings.missing)
  const { config } = settings

  const form = await request.formData().catch(() => null)
  if (!form) return photoFailure('request', 'That request could not be read.', 400)

  const parsed = photoRequestSchema.safeParse({
    slug: formText(form, 'slug'),
    title: formText(form, 'title'),
    summary: formText(form, 'summary'),
    notes: formText(form, 'notes'),
    sourceUrl: formText(form, 'sourceUrl'),
  })
  if (!parsed.success) {
    const [issue] = parsed.error.issues
    return photoFailure('request', issue?.message ?? 'Invalid request.', 400)
  }
  const { sourceUrl, slug, ...text } = parsed.data

  const reference = formFile(form, 'reference')
  const referenceProblem = reference && photoFileProblem(reference)
  if (referenceProblem) return photoFailure('source', referenceProblem, 400)
  if (sourceUrl && !isOurPhoto(sourceUrl, config.r2.publicUrl)) {
    return photoFailure('source', 'That photo is not one of ours.', 400)
  }

  const sources = reference ? [reference] : []
  try {
    if (sourceUrl) sources.unshift(await fetchSourcePhoto(sourceUrl))
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    logger.error('Could not read the source photo', { slug, error: message })
    return photoFailure('source', message, 502)
  }

  const result = await createPhotoCandidate(
    {
      generateImage: (prompt) =>
        generateOpenAiImage(config.openAiApiKey, prompt),
      editImage: (prompt, images) =>
        editOpenAiImage(config.openAiApiKey, prompt, images),
      optimizeImage: toWebJpeg,
      uploadImage: (key, bytes) => uploadToR2(config.r2, key, bytes),
    },
    { slug, sources, ...text }
  )
  if (!result.ok) {
    logger.error('Photo generation failed', { slug, ...result })
    return photoFailure(result.stage, result.error, 502)
  }

  logger.info('Photo candidate created', { slug, url: result.url })
  return NextResponse.json(result)
}
