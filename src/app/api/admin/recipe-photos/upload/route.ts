import type { NextRequest } from 'next/server'

import { NextResponse } from 'next/server'

import type { PhotoResponse } from '@/validations'

import { Env } from '@/libs/Env'
import { logger } from '@/libs/Logger'
import {
  readPhotoConfig,
  storeUploadedPhoto,
  toWebJpeg,
  uploadToR2,
} from '@/libs/photos'
import {
  formFile,
  formText,
  missingPhotoConfig,
  photoFailure,
  photoFileProblem,
} from '@/libs/photos/photoRouteHelpers'
import { isOwner } from '@/libs/supabase/owner'
import { recipeSlugSchema } from '@/validations'

// Stores a photo the owner uploaded as a candidate, the same as a generated one. It goes live
// only when chosen, and can be refined by generating from it.
export const POST = async (
  request: NextRequest
): Promise<NextResponse<PhotoResponse>> => {
  if (!(await isOwner())) {
    return photoFailure('request', 'Only the site owner can upload photos.', 403)
  }

  const settings = readPhotoConfig(Env)
  if ('missing' in settings) return missingPhotoConfig(settings.missing)
  const { config } = settings

  const form = await request.formData().catch(() => null)
  const photo = form ? formFile(form, 'photo') : undefined
  if (!form || !photo) {
    return photoFailure('request', 'Choose a photo to upload.', 400)
  }
  const problem = photoFileProblem(photo)
  if (problem) return photoFailure('source', problem, 400)

  const slug = recipeSlugSchema.optional().safeParse(formText(form, 'slug'))
  const result = await storeUploadedPhoto(
    {
      optimizeImage: toWebJpeg,
      uploadImage: (key, bytes) => uploadToR2(config.r2, key, bytes),
    },
    { slug: slug.success ? slug.data : undefined, photo }
  )
  if (!result.ok) {
    logger.error('Photo upload failed', { ...result })
    return photoFailure(result.stage, result.error, 502)
  }
  return NextResponse.json(result)
}
