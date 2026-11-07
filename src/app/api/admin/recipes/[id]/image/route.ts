import type { NextRequest } from 'next/server'

import { NextResponse } from 'next/server'

import type { PhotoResponse, PhotoStage } from '@/validations'

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
import { isOwner } from '@/libs/supabase/owner'
import { services } from '@/services'
import {
  MAX_REFERENCE_BYTES,
  photoChoiceSchema,
  photoRequestSchema,
  REFERENCE_TYPES,
} from '@/validations'

// Image generation can take a couple of minutes
export const maxDuration = 300

type RouteContext = {
  params: Promise<{ id: string }>
}

const fail = (
  stage: PhotoStage,
  error: string,
  status: number
): NextResponse<PhotoResponse> =>
  NextResponse.json({ ok: false, stage, error }, { status })

const missingConfig = (
  missing: string[]
): NextResponse<PhotoResponse> =>
  fail('config', `Photo settings are missing: ${missing.join(', ')}`, 503)

// A photo we stored ourselves. This stops the server from fetching, or a recipe from pointing at,
// an address the request made up.
const isOurPhoto = (url: string, publicUrl: string): boolean =>
  url.startsWith(`${publicUrl.replace(/\/+$/, '')}/recipes/`)

const fetchSourcePhoto = async (url: string): Promise<File> => {
  const response = await fetch(url)
  if (!response.ok) throw new Error(`Could not read the photo (${response.status})`)
  return new File([await response.arrayBuffer()], 'source.jpg', {
    type: 'image/jpeg',
  })
}

const textField = (form: FormData, name: string): string | undefined => {
  const value = form.get(name)
  return typeof value === 'string' && value !== '' ? value : undefined
}

// Generates a candidate from what is on screen. The reference photo is only passed through to
// OpenAI, never stored. The recipe does not change until the owner picks a candidate with PUT.
export const POST = async (
  request: NextRequest,
  { params }: RouteContext
): Promise<NextResponse<PhotoResponse>> => {
  if (!(await isOwner())) {
    return fail('request', 'Only the site owner can generate photos.', 403)
  }
  const { id } = await params

  const settings = readPhotoConfig(Env)
  if ('missing' in settings) return missingConfig(settings.missing)
  const { config } = settings

  const form = await request.formData().catch(() => null)
  if (!form) return fail('request', 'That request could not be read.', 400)

  const parsed = photoRequestSchema.safeParse({
    title: textField(form, 'title'),
    summary: textField(form, 'summary'),
    notes: textField(form, 'notes'),
    sourceUrl: textField(form, 'sourceUrl'),
  })
  if (!parsed.success) {
    const [issue] = parsed.error.issues
    return fail('request', issue?.message ?? 'Invalid request.', 400)
  }
  const { sourceUrl, ...text } = parsed.data

  const reference = form.get('reference')
  const referenceFile = reference instanceof File ? reference : undefined
  if (referenceFile && !REFERENCE_TYPES.includes(referenceFile.type)) {
    return fail('source', 'A reference must be a JPEG, PNG, or WebP.', 400)
  }
  if (referenceFile && referenceFile.size > MAX_REFERENCE_BYTES) {
    return fail('source', 'A reference photo must be 4 MB or smaller.', 400)
  }
  if (sourceUrl && !isOurPhoto(sourceUrl, config.r2.publicUrl)) {
    return fail('source', 'That photo is not one of ours.', 400)
  }

  const slug = await services.recipeService.getRecipeSlug(id)
  if (!slug) return fail('request', 'That recipe no longer exists.', 404)

  const sources = referenceFile ? [referenceFile] : []
  try {
    if (sourceUrl) sources.unshift(await fetchSourcePhoto(sourceUrl))
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    logger.error('Could not read the source photo', { id, error: message })
    return fail('source', message, 502)
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
    logger.error('Photo generation failed', { id, slug, ...result })
    return fail(result.stage, result.error, 502)
  }

  logger.info('Photo candidate created', { id, slug, url: result.url })
  return NextResponse.json(result)
}

// Makes a candidate the recipe's photo
export const PUT = async (
  request: NextRequest,
  { params }: RouteContext
): Promise<NextResponse<PhotoResponse>> => {
  if (!(await isOwner())) {
    return fail('request', 'Only the site owner can change photos.', 403)
  }
  const { id } = await params

  const settings = readPhotoConfig(Env)
  if ('missing' in settings) return missingConfig(settings.missing)

  const body: unknown = await request.json().catch(() => null)
  const parsed = photoChoiceSchema.safeParse(body)
  if (
    !parsed.success ||
    !isOurPhoto(parsed.data.url, settings.config.r2.publicUrl)
  ) {
    return fail('request', 'That is not a photo we generated.', 400)
  }
  const { url } = parsed.data

  try {
    const saved = await services.recipeService.setRecipePhoto(id, url)
    if (!saved) return fail('save', 'That recipe no longer exists.', 404)
  } catch (error) {
    logger.error('Could not save the recipe photo', { id, error: String(error) })
    return fail('save', 'The photo could not be saved.', 500)
  }
  return NextResponse.json({ ok: true, url })
}
