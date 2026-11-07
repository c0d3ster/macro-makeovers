import { describe, expect, it, vi } from 'vitest'

import type { PhotoCandidateDeps } from './photoCandidate'

import {
  buildPhotoPrompt,
  candidateKey,
  createPhotoCandidate,
} from './photoCandidate'

const request = {
  slug: 'spicy-chili',
  title: 'Spicy Chili',
  summary: 'A high protein bowl.',
  sources: [],
}

const makeDeps = (): PhotoCandidateDeps => ({
  generateImage: vi.fn().mockResolvedValue(new Uint8Array([1, 2])),
  editImage: vi.fn().mockResolvedValue(new Uint8Array([3, 4])),
  optimizeImage: vi.fn().mockResolvedValue(new Uint8Array([9])),
  uploadImage: vi.fn().mockResolvedValue('https://cdn.test/photo.jpg'),
})

describe('buildPhotoPrompt', () => {
  it('uses the title and summary and rules out text and people', () => {
    const prompt = buildPhotoPrompt(request)

    expect(prompt).toContain('Spicy Chili')
    expect(prompt).toContain('A high protein bowl.')
    expect(prompt).toContain('No text')
    expect(prompt).not.toContain('Direction')
  })

  it('adds the notes as direction when there are any', () => {
    expect(buildPhotoPrompt({ ...request, notes: 'More cheese' })).toContain(
      'Direction for this photo: More cheese'
    )
  })
})

describe('candidateKey', () => {
  it('is unique per attempt', () => {
    expect(candidateKey('spicy-chili', 123)).toBe('recipes/spicy-chili-123.jpg')
  })
})

describe('createPhotoCandidate', () => {
  it('generates from scratch, optimizes, and returns the uploaded URL', async () => {
    const deps = makeDeps()

    await expect(createPhotoCandidate(deps, request)).resolves.toEqual({
      ok: true,
      url: 'https://cdn.test/photo.jpg',
    })
    expect(deps.editImage).not.toHaveBeenCalled()
    expect(deps.optimizeImage).toHaveBeenCalledWith(new Uint8Array([1, 2]))
    expect(deps.uploadImage).toHaveBeenCalledWith(
      expect.stringMatching(/^recipes\/spicy-chili-\d+\.jpg$/),
      new Uint8Array([9])
    )
  })

  it('works from the source images when there are any', async () => {
    const deps = makeDeps()
    const sources = [new File(['a'], 'reference.png', { type: 'image/png' })]

    await createPhotoCandidate(deps, { ...request, sources })

    expect(deps.editImage).toHaveBeenCalledWith(expect.any(String), sources)
    expect(deps.generateImage).not.toHaveBeenCalled()
    expect(deps.optimizeImage).toHaveBeenCalledWith(new Uint8Array([3, 4]))
  })

  it.each([
    ['generate', 'generateImage'],
    ['optimize', 'optimizeImage'],
    ['upload', 'uploadImage'],
  ] as const)('names the %s stage when it fails', async (stage, dep) => {
    const deps = { ...makeDeps(), [dep]: vi.fn().mockRejectedValue(new Error('boom')) }

    await expect(createPhotoCandidate(deps, request)).resolves.toEqual({
      ok: false,
      stage,
      error: 'boom',
    })
  })
})
