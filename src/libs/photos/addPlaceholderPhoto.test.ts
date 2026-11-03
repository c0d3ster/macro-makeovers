import { describe, expect, it, vi } from 'vitest'

import { addPlaceholderPhoto } from './addPlaceholderPhoto'

const recipe = { id: 'r1', slug: 's', title: 'T', summary: 'S' }

const fullEnv = {
  OPENAI_API_KEY: 'k',
  R2_ACCOUNT_ID: 'a',
  R2_ACCESS_KEY_ID: 'b',
  R2_SECRET_ACCESS_KEY: 'c',
  R2_BUCKET: 'bucket',
  R2_PUBLIC_URL: 'https://cdn.test',
}

describe('addPlaceholderPhoto', () => {
  it('skips quietly when env is missing', async () => {
    const writer = { setPlaceholderImage: vi.fn() }
    const fetchSpy = vi.spyOn(globalThis, 'fetch')

    await expect(
      addPlaceholderPhoto(writer, recipe, {})
    ).resolves.toBeUndefined()
    expect(fetchSpy).not.toHaveBeenCalled()
    expect(writer.setPlaceholderImage).not.toHaveBeenCalled()

    fetchSpy.mockRestore()
  })

  it('never throws when the outside services fail', async () => {
    const writer = { setPlaceholderImage: vi.fn() }
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(new Response('no', { status: 500 }))

    await expect(
      addPlaceholderPhoto(writer, recipe, fullEnv)
    ).resolves.toBeUndefined()
    expect(writer.setPlaceholderImage).not.toHaveBeenCalled()

    fetchSpy.mockRestore()
  })
})
