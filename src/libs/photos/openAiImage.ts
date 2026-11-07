import { Buffer } from 'node:buffer'

type FetchLike = typeof fetch

type ImagesResponse = {
  data?: { b64_json?: string }[]
  error?: { message?: string }
}

const MODEL = 'gpt-image-2.5-sunburst'
const SIZE = '1536x1024'

const isImagesResponse = (value: unknown): value is ImagesResponse =>
  typeof value === 'object' && value !== null

const readJson = async (response: Response): Promise<ImagesResponse> => {
  const body: unknown = await response.json().catch(() => undefined)
  return isImagesResponse(body) ? body : {}
}

// Returns the PNG bytes, or throws with OpenAI's own reason so the editor can show it
const readImage = async (
  response: Response
): Promise<Uint8Array<ArrayBuffer>> => {
  const body = await readJson(response)
  if (!response.ok) {
    const reason = body.error?.message ? `: ${body.error.message}` : ''
    throw new Error(
      `OpenAI image request failed with ${response.status}${reason}`
    )
  }

  const encoded = body.data?.[0]?.b64_json
  if (!encoded) throw new Error('OpenAI returned no image data')
  return Uint8Array.from(Buffer.from(encoded, 'base64'))
}

// Generates one image and returns its PNG bytes. A plain fetch call, so there is no SDK to mock.
export const generateOpenAiImage = async (
  apiKey: string,
  prompt: string,
  fetchImpl: FetchLike = fetch
): Promise<Uint8Array<ArrayBuffer>> => {
  const response = await fetchImpl(
    'https://api.openai.com/v1/images/generations',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ model: MODEL, prompt, size: SIZE, n: 1 }),
    }
  )
  return readImage(response)
}

// The same, guided by source images: an earlier attempt to refine, or a reference photo. The
// edits endpoint takes multipart, and fetch sets the boundary when the body is FormData.
export const editOpenAiImage = async (
  apiKey: string,
  prompt: string,
  images: File[],
  fetchImpl: FetchLike = fetch
): Promise<Uint8Array<ArrayBuffer>> => {
  const body = new FormData()
  body.set('model', MODEL)
  body.set('prompt', prompt)
  body.set('size', SIZE)
  body.set('n', '1')
  images.forEach((image) => body.append('image[]', image))

  const response = await fetchImpl('https://api.openai.com/v1/images/edits', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}` },
    body,
  })
  return readImage(response)
}
