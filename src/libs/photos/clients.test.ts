import { describe, expect, it, vi } from 'vitest'

import { generateOpenAiImage } from './openAiImage'
import { readPhotoConfig } from './photoConfig'
import { uploadToR2 } from './r2Storage'

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

  it('throws when R2 rejects the upload', async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValue(new Response(null, { status: 403 }))

    await expect(
      uploadToR2(config, 'a.png', new Uint8Array([1]), fetchMock)
    ).rejects.toThrow('403')
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
