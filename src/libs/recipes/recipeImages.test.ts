import { existsSync, readdirSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

import { placeholderPhotoFor } from './recipeImages'

const recipeSlugs = readdirSync(resolve(process.cwd(), 'content/recipes')).map(
  (file) => file.replace(/\.json$/, '')
)

describe('placeholderPhotoFor', () => {
  it('points every mapped recipe at a file that exists', () => {
    const mapped = recipeSlugs.flatMap((slug) => {
      const path = placeholderPhotoFor(slug)
      return path ? [path] : []
    })

    expect(mapped.length).toBeGreaterThan(0)

    mapped.forEach((path) => {
      expect(
        existsSync(resolve(process.cwd(), 'public', path.slice(1))),
        path
      ).toBe(true)
    })
  })

  it('covers every recipe', () => {
    const missing = recipeSlugs.filter((slug) => !placeholderPhotoFor(slug))

    expect(missing).toEqual([])
  })

  it('has nothing for an unknown slug', () => {
    expect(placeholderPhotoFor('not-a-recipe')).toBeUndefined()
  })
})
