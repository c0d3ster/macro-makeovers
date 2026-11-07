import type { PhotoResponse } from '@/validations'

import { photoResponseSchema } from '@/validations'

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

// Makes a candidate photo from the recipe on screen. Nothing changes until one is chosen.
export const generateRecipePhoto = (request: FormData): Promise<PhotoResponse> =>
  sendPhotoRequest('/api/admin/recipe-photos', { method: 'POST', body: request })

// Stores an uploaded photo as a candidate
export const uploadRecipePhoto = (request: FormData): Promise<PhotoResponse> =>
  sendPhotoRequest('/api/admin/recipe-photos/upload', {
    method: 'POST',
    body: request,
  })

// Makes a candidate the saved recipe's photo
export const chooseRecipePhoto = (
  recipeId: string,
  url: string
): Promise<PhotoResponse> =>
  sendPhotoRequest(`/api/admin/recipes/${recipeId}/image`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url }),
  })
