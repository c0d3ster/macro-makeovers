import { NextResponse } from 'next/server'

import type { PhotoResponse, PhotoStage } from '@/validations'

import { MAX_PHOTO_BYTES, PHOTO_TYPES } from '@/validations'

// Shared by the photo routes, so every failure comes back in the shape the editor shows

export const photoFailure = (
  stage: PhotoStage,
  error: string,
  status: number
): NextResponse<PhotoResponse> =>
  NextResponse.json({ ok: false, stage, error }, { status })

export const missingPhotoConfig = (
  missing: string[]
): NextResponse<PhotoResponse> =>
  photoFailure(
    'config',
    `Photo settings are missing: ${missing.join(', ')}`,
    503
  )

// A photo we stored ourselves. This stops the server from fetching, or a recipe from pointing at,
// an address the request made up.
export const isOurPhoto = (url: string, publicUrl: string): boolean =>
  url.startsWith(`${publicUrl.replace(/\/+$/, '')}/recipes/`)

// Why a file can't be used as a photo, or undefined when it can
export const photoFileProblem = (file: File): string | undefined => {
  if (!PHOTO_TYPES.includes(file.type)) {
    return 'A photo must be a JPEG, PNG, or WebP.'
  }
  if (file.size > MAX_PHOTO_BYTES) return 'A photo must be 4 MB or smaller.'
  return undefined
}

export const formText = (form: FormData, name: string): string | undefined => {
  const value = form.get(name)
  return typeof value === 'string' && value !== '' ? value : undefined
}

export const formFile = (form: FormData, name: string): File | undefined => {
  const value = form.get(name)
  return value instanceof File ? value : undefined
}
