import { describe, expect, it, vi } from 'vitest'

import type { PhotoDeps, PhotoRecipe } from './placeholderPhoto'

import {
  buildPhotoPrompt,
  createPlaceholderPhoto,
  photoKey,
} from './placeholderPhoto'

const recipe: PhotoRecipe = {
  id: 'r1',
  slug: 'spicy-chili',
  title: 'Spicy Chili',
  summary: 'A high protein bowl.',
}

const makeDeps = (saved: boolean): PhotoDeps => ({
  generateImage: vi.fn().mockResolvedValue(new Uint8Array([1, 2])),
  optimizeImage: vi.fn().mockResolvedValue(new Uint8Array([9])),
  uploadImage: vi.fn().mockResolvedValue('https://cdn.test/a.png'),
  saveImageUrl: vi.fn().mockResolvedValue(saved),
})

describe('buildPhotoPrompt', () => {
  it('uses the title and summary', () => {
    const prompt = buildPhotoPrompt(recipe)

    expect(prompt).toContain('Spicy Chili')
    expect(prompt).toContain('A high protein bowl.')
  })
})

describe('photoKey', () => {
  it('namespaces by slug and marks the file as a placeholder', () => {
    expect(photoKey('spicy-chili', 5)).toBe(
      'recipes/spicy-chili-placeholder-5.jpg'
    )
  })
})

describe('createPlaceholderPhoto', () => {
  it('generates, uploads, then saves the URL', async () => {
    const deps = makeDeps(true)

    await expect(createPlaceholderPhoto(deps, recipe)).resolves.toBe('saved')
    expect(deps.uploadImage).toHaveBeenCalledWith(
      expect.stringContaining('recipes/spicy-chili-placeholder-'),
      new Uint8Array([9])
    )
    expect(deps.saveImageUrl).toHaveBeenCalledWith(
      'r1',
      'https://cdn.test/a.png'
    )
  })

  it('uploads the optimized bytes, not the generated ones', async () => {
    const deps = makeDeps(true)

    await createPlaceholderPhoto(deps, recipe)

    expect(deps.optimizeImage).toHaveBeenCalledWith(new Uint8Array([1, 2]))
  })

  it('reports when the recipe already had a photo', async () => {
    await expect(createPlaceholderPhoto(makeDeps(false), recipe)).resolves.toBe(
      'skipped-existing'
    )
  })

  it('does not upload or save when generation fails', async () => {
    const deps = makeDeps(true)
    vi.mocked(deps.generateImage).mockRejectedValue(new Error('boom'))

    await expect(createPlaceholderPhoto(deps, recipe)).rejects.toThrow('boom')
    expect(deps.uploadImage).not.toHaveBeenCalled()
    expect(deps.saveImageUrl).not.toHaveBeenCalled()
  })
})
