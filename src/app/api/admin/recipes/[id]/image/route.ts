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
import { photoChoiceSchema } from '@/validations'

type RouteContext = {
  params: Promise<{ id: string }>
}

// Makes a generated or uploaded photo the recipe's photo
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
  const { url } = parsed.data

  try {
    const saved = await services.recipeService.setRecipePhoto(id, url)
    if (!saved) return photoFailure('save', 'That recipe no longer exists.', 404)
  } catch (error) {
    logger.error('Could not save the recipe photo', { id, error: String(error) })
    return photoFailure('save', 'The photo could not be saved.', 500)
  }
  return NextResponse.json({ ok: true, url })
}
