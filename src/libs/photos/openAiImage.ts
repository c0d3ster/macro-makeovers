type FetchLike = typeof fetch

type ImagesResponse = {
  data?: { b64_json?: string }[]
}

const isImagesResponse = (value: unknown): value is ImagesResponse =>
  typeof value === 'object' && value !== null

// Generates one image and returns its PNG bytes. A plain fetch call, so there is no SDK to mock.
export const generateOpenAiImage = async (
  apiKey: string,
  prompt: string,
  fetchImpl: FetchLike = fetch
): Promise<Uint8Array> => {
  const response = await fetchImpl(
    'https://api.openai.com/v1/images/generations',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-image-1',
        prompt,
        size: '1024x1024',
        n: 1,
      }),
    }
  )
  if (!response.ok) {
    throw new Error(`OpenAI image request failed with ${response.status}`)
  }

  const body: unknown = await response.json()
  const encoded = isImagesResponse(body) ? body.data?.[0]?.b64_json : undefined
  if (!encoded) throw new Error('OpenAI returned no image data')
  return Uint8Array.from(Buffer.from(encoded, 'base64'))
}
