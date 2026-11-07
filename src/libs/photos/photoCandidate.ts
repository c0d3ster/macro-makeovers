import type { PhotoStage } from '@/validations'

// Makes one candidate photo for the editor. Every outside call is injected, so the flow is tested
// without OpenAI or R2. Nothing here touches the recipe: a candidate only goes live when the owner
// picks it.

type PhotoCandidateRequest = {
  slug: string
  title: string
  summary: string
  // The owner's own direction for this attempt
  notes?: string
  // Images to work from: a reference photo and/or the attempt being refined
  sources: File[]
}

export type PhotoCandidateDeps = {
  generateImage: (prompt: string) => Promise<Uint8Array<ArrayBuffer>>
  editImage: (
    prompt: string,
    sources: File[]
  ) => Promise<Uint8Array<ArrayBuffer>>
  // Turns the generated image into the web JPEG that gets stored
  optimizeImage: (
    image: Uint8Array<ArrayBuffer>
  ) => Promise<Uint8Array<ArrayBuffer>>
  // Stores the bytes under the key and returns the public URL
  uploadImage: (key: string, bytes: Uint8Array<ArrayBuffer>) => Promise<string>
}

type PhotoCandidateResult =
  | { ok: true; url: string }
  | { ok: false; stage: PhotoStage; error: string }

export const buildPhotoPrompt = ({
  title,
  summary,
  notes,
}: Pick<PhotoCandidateRequest, 'title' | 'summary' | 'notes'>): string =>
  [
    `Appetizing overhead food photograph of ${title}. ${summary}`,
    'Natural light, plated on a simple table, shallow depth of field.',
    'No text, no labels, no people, no hands.',
    ...(notes ? [`Direction for this photo: ${notes}`] : []),
  ].join(' ')

// Unique per attempt, so the image optimizer and CDN never serve an older attempt
export const candidateKey = (slug: string, now: number = Date.now()): string =>
  `recipes/${slug}-${now}.jpg`

// Never throws. A failure comes back naming the stage, so the editor can say what went wrong.
export const createPhotoCandidate = async (
  deps: PhotoCandidateDeps,
  { sources, ...request }: PhotoCandidateRequest
): Promise<PhotoCandidateResult> => {
  let stage: PhotoStage = 'generate'
  try {
    const prompt = buildPhotoPrompt(request)
    const generated = await (sources.length > 0
      ? deps.editImage(prompt, sources)
      : deps.generateImage(prompt))

    stage = 'optimize'
    const bytes = await deps.optimizeImage(generated)

    stage = 'upload'
    const url = await deps.uploadImage(candidateKey(request.slug), bytes)
    return { ok: true, url }
  } catch (error) {
    return {
      ok: false,
      stage,
      error: error instanceof Error ? error.message : String(error),
    }
  }
}
