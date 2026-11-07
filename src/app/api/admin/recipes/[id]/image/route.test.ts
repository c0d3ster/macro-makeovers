import { NextRequest } from 'next/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { isOwner } from '@/libs/supabase/owner'
import { services } from '@/services'

import { POST, PUT } from './route'

vi.mock('@/libs/supabase/owner', () => ({ isOwner: vi.fn() }))
vi.mock('@/libs/Logger', () => ({
  logger: { error: vi.fn(), info: vi.fn(), warn: vi.fn() },
}))
vi.mock('@/services', () => ({
  services: {
    recipeService: { getRecipeSlug: vi.fn(), setRecipePhoto: vi.fn() },
  },
}))

// A mutable stand-in for the environment, so a test can leave a setting out
const env = vi.hoisted((): Record<string, string | undefined> => ({
  OPENAI_API_KEY: 'key',
  R2_ACCOUNT_ID: 'account',
  R2_ACCESS_KEY_ID: 'access',
  R2_SECRET_ACCESS_KEY: 'secret',
  R2_BUCKET: 'bucket',
  R2_PUBLIC_URL: 'https://cdn.test',
}))
vi.mock('@/libs/Env', () => ({ Env: env }))

const context = { params: Promise.resolve({ id: 'recipe-1' }) }

const choose = (url: string): Promise<Response> =>
  PUT(
    new NextRequest('http://localhost/api/admin/recipes/recipe-1/image', {
      method: 'PUT',
      body: JSON.stringify({ url }),
    }),
    context
  )

const generateRequest = new NextRequest(
  'http://localhost/api/admin/recipes/recipe-1/image',
  { method: 'POST' }
)

describe('recipe photo route', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    env.OPENAI_API_KEY = 'key'
    vi.mocked(isOwner).mockResolvedValue(true)
    vi.mocked(services.recipeService.setRecipePhoto).mockResolvedValue(true)
  })

  it('turns away anyone but the owner', async () => {
    vi.mocked(isOwner).mockResolvedValue(false)

    expect((await POST(generateRequest, context)).status).toBe(403)
    expect((await choose('https://cdn.test/recipes/a.jpg')).status).toBe(403)
    expect(services.recipeService.setRecipePhoto).not.toHaveBeenCalled()
  })

  it('names the missing settings instead of failing silently', async () => {
    env.OPENAI_API_KEY = undefined

    const response = await POST(generateRequest, context)

    expect(response.status).toBe(503)
    await expect(response.json()).resolves.toEqual({
      ok: false,
      stage: 'config',
      error: 'Photo settings are missing: OPENAI_API_KEY',
    })
  })

  it('saves a photo from our bucket', async () => {
    const url = 'https://cdn.test/recipes/test-chili-123.jpg'

    const response = await choose(url)

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({ ok: true, url })
    expect(services.recipeService.setRecipePhoto).toHaveBeenCalledWith(
      'recipe-1',
      url
    )
  })

  it('refuses a photo from anywhere else', async () => {
    const response = await choose('https://evil.test/recipes/a.jpg')

    expect(response.status).toBe(400)
    expect(services.recipeService.setRecipePhoto).not.toHaveBeenCalled()
  })

  it('reports an unknown recipe', async () => {
    vi.mocked(services.recipeService.setRecipePhoto).mockResolvedValue(false)

    expect((await choose('https://cdn.test/recipes/a.jpg')).status).toBe(404)
  })
})
