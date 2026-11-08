import { Buffer } from 'node:buffer'
import { describe, expect, it, vi } from 'vitest'

import { editOpenAiImage, generateOpenAiImage } from './openAiImage'
import { readPhotoConfig } from './photoConfig'
import { uploadToR2 } from './r2Storage'

describe('editOpenAiImage', () => {
  it('sends the source images as multipart to the edits endpoint', async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(
        JSON.stringify({
          data: [{ b64_json: Buffer.from('png').toString('base64') }],
        })
      )
    )
    const source = new File(['a'], 'reference.png', { type: 'image/png' })

    const bytes = await editOpenAiImage('key', 'a prompt', [source], fetchMock)

    expect(Buffer.from(bytes).toString()).toBe('png')

    const [url, init] = fetchMock.mock.calls[0] ?? []
    const body = init?.body

    expect(url).toBe('https://api.openai.com/v1/images/edits')
    expect(body).toBeInstanceOf(FormData)
    expect(body instanceof FormData && body.get('prompt')).toBe('a prompt')
    expect(body instanceof FormData && body.getAll('image[]')).toHaveLength(1)
  })

  it("includes OpenAI's reason when a request fails", async () => {
    const failing = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(JSON.stringify({ error: { message: 'Billing limit' } }), {
        status: 400,
      })
    )

    await expect(editOpenAiImage('k', 'p', [], failing)).rejects.toThrow(
      'OpenAI image request failed with 400: Billing limit'
    )
  })
})

describe('generateOpenAiImage', () => {
  it('decodes the base64 image', async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(
        JSON.stringify({
          data: [{ b64_json: Buffer.from('png').toString('base64') }],
        })
      )
    )

    const bytes = await generateOpenAiImage('key', 'a prompt', fetchMock)

    expect(Buffer.from(bytes).toString()).toBe('png')
    expect(fetchMock).toHaveBeenCalledOnce()
  })

  it('throws on an API error and on an empty body', async () => {
    const failing = vi
      .fn<typeof fetch>()
      .mockResolvedValue(new Response('x', { status: 429 }))

    await expect(generateOpenAiImage('k', 'p', failing)).rejects.toThrow('429')

    const empty = vi
      .fn<typeof fetch>()
      .mockResolvedValue(new Response(JSON.stringify({ data: [] })))

    await expect(generateOpenAiImage('k', 'p', empty)).rejects.toThrow(
      'no image data'
    )
  })
})

describe('uploadToR2', () => {
  const config = {
    accountId: 'acct',
    accessKeyId: 'id',
    secretAccessKey: 'secret',
    bucket: 'photos',
    publicUrl: 'https://cdn.test/',
  }

  it('PUTs to the bucket and returns the public URL', async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValue(new Response(null, { status: 200 }))

    const url = await uploadToR2(
      config,
      'recipes/a.jpg',
      new Uint8Array([1]),
      fetchMock
    )

    expect(url).toBe('https://cdn.test/recipes/a.jpg')
    expect(fetchMock).toHaveBeenCalledOnce()
  })

  // A stream body goes out without a Content-Length, which R2 refuses with 411
  it('sends the signed headers with the bytes themselves as the body', async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValue(new Response(null, { status: 200 }))
    const bytes = new Uint8Array([1, 2, 3])

    await uploadToR2(config, 'recipes/a.jpg', bytes, fetchMock)

    const [target, init] = fetchMock.mock.calls[0] ?? []
    const headers = new Headers(init?.headers)

    expect(target).toBe('https://acct.r2.cloudflarestorage.com/photos/recipes/a.jpg')
    expect(init?.method).toBe('PUT')
    expect(init?.body).toBe(bytes)
    expect(headers.get('authorization')).toMatch(/^AWS4-HMAC-SHA256 /)
    expect(headers.get('content-type')).toBe('image/jpeg')
  })

  it('throws when R2 rejects the upload', async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValue(
        new Response(
          '<Error><Code>AccessDenied</Code><Message>Access Denied</Message></Error>',
          { status: 403 }
        )
      )

    await expect(
      uploadToR2(config, 'a.png', new Uint8Array([1]), fetchMock)
    ).rejects.toThrow('R2 upload failed with 403: Access Denied')
  })
})

describe('readPhotoConfig', () => {
  it('lists every missing name', () => {
    expect(readPhotoConfig({ OPENAI_API_KEY: 'k' })).toEqual({
      missing: [
        'R2_ACCOUNT_ID',
        'R2_ACCESS_KEY_ID',
        'R2_SECRET_ACCESS_KEY',
        'R2_BUCKET',
        'R2_PUBLIC_URL',
      ],
    })
  })
})
