import type { PhotoResponse } from '@/validations'

import { photoResponseSchema } from '@/validations'

const photoRoute = (recipeId: string): string =>
  `/api/admin/recipes/${recipeId}/image`

// A timeout or a refused upload comes back from the platform, not our route, so it may not be our
// JSON at all. Every outcome still ends as a message the editor can show.
const readPhotoResponse = async (response: Response): Promise<PhotoResponse> => {
  const body: unknown = await response.json().catch(() => null)
  const parsed = photoResponseSchema.safeParse(body)
  if (parsed.success) return parsed.data

  return {
    ok: false,
    stage: 'request',
    error: `The server did not finish the request (${response.status}). Try again.`,
  }
}

const sendPhotoRequest = async (
  url: string,
  init: RequestInit
): Promise<PhotoResponse> => {
  try {
    return await readPhotoResponse(await fetch(url, init))
  } catch {
    return {
      ok: false,
      stage: 'request',
      error: 'Could not reach the server. Check your connection and try again.',
    }
  }
}

// Makes a candidate photo. The recipe does not change until one is chosen.
export const generateRecipePhoto = (
  recipeId: string,
  request: FormData
): Promise<PhotoResponse> =>
  sendPhotoRequest(photoRoute(recipeId), { method: 'POST', body: request })

export const chooseRecipePhoto = (
  recipeId: string,
  url: string
): Promise<PhotoResponse> =>
  sendPhotoRequest(photoRoute(recipeId), {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url }),
  })
