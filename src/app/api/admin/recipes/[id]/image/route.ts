import type { NextRequest } from 'next/server'

import { NextResponse } from 'next/server'

import type { PhotoResponse } from '@/validations'

import { Env } from '@/libs/Env'
import { logger } from '@/libs/Logger'
import { readPhotoConfig } from '@/libs/photos'
import {
  isOurPhoto,
  missingPhotoConfig,
  photoFailure,
} from '@/libs/photos/photoRouteHelpers'
import { isOwner } from '@/libs/supabase/owner'
import { services } from '@/services'
import { buildPhotoClearSchema, photoChoiceSchema } from '@/validations'

type RouteContext = {
  params: Promise<{ id: string }>
}

// Makes a generated or uploaded photo the recipe's photo, or one build's when it names a build
export const PUT = async (
  request: NextRequest,
  { params }: RouteContext
): Promise<NextResponse<PhotoResponse>> => {
  if (!(await isOwner())) {
    return photoFailure('request', 'Only the site owner can change photos.', 403)
  }
  const { id } = await params

  const settings = readPhotoConfig(Env)
  if ('missing' in settings) return missingPhotoConfig(settings.missing)

  const body: unknown = await request.json().catch(() => null)
  const parsed = photoChoiceSchema.safeParse(body)
  if (
    !parsed.success ||
    !isOurPhoto(parsed.data.url, settings.config.r2.publicUrl)
  ) {
    return photoFailure('request', 'That is not a photo we stored.', 400)
  }
  const { url, build } = parsed.data

  try {
    if (build) {
      const saved = await services.recipeService.setBuildPhoto(id, build, url)
      if (!saved) {
        return photoFailure(
          'save',
          'That build is not saved yet. Save the recipe, then choose the photo.',
          404
        )
      }
      return NextResponse.json({ ok: true, url })
    }
    const saved = await services.recipeService.setRecipePhoto(id, url)
    if (!saved) return photoFailure('save', 'That recipe no longer exists.', 404)
  } catch (error) {
    logger.error('Could not save the recipe photo', { id, error: String(error) })
    return photoFailure('save', 'The photo could not be saved.', 500)
  }
  return NextResponse.json({ ok: true, url })
}

// Clears a build's own photo, so the build shows the recipe photo again. Answers with the
// recipe photo's URL when there is one, which is what the build now shows.
export const DELETE = async (
  request: NextRequest,
  { params }: RouteContext
): Promise<NextResponse<{ ok: true } | PhotoResponse>> => {
  if (!(await isOwner())) {
    return photoFailure('request', 'Only the site owner can change photos.', 403)
  }
  const { id } = await params

  const body: unknown = await request.json().catch(() => null)
  const parsed = buildPhotoClearSchema.safeParse(body)
  if (!parsed.success) return photoFailure('request', 'Name the build to clear.', 400)

  try {
    const saved = await services.recipeService.setBuildPhoto(
      id,
      parsed.data.build,
      null
    )
    if (!saved) return photoFailure('save', 'That build is not saved yet.', 404)
  } catch (error) {
    logger.error('Could not clear the build photo', { id, error: String(error) })
    return photoFailure('save', 'The photo could not be cleared.', 500)
  }
  return NextResponse.json({ ok: true })
}
