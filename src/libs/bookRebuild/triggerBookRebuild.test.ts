import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  BOOK_REBUILD_EVENT,
  resetBookRebuildGuard,
  triggerBookRebuild,
} from './triggerBookRebuild'

type TestEnv = {
  GITHUB_DISPATCH_TOKEN: string | undefined
  GITHUB_REPO: string | undefined
}

const env = vi.hoisted((): TestEnv => ({
  GITHUB_DISPATCH_TOKEN: 'token-1',
  GITHUB_REPO: 'owner/repo',
}))

vi.mock('@/libs/Env', () => ({ Env: env }))
vi.mock('@/libs/Logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}))

const fetchMock = vi.fn<typeof fetch>()

describe('triggerBookRebuild', () => {
  beforeEach(() => {
    resetBookRebuildGuard()
    fetchMock.mockReset()
    fetchMock.mockResolvedValue(new Response(null, { status: 204 }))
    vi.stubGlobal('fetch', fetchMock)
    env.GITHUB_DISPATCH_TOKEN = 'token-1'
    env.GITHUB_REPO = 'owner/repo'
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('skips without a token', async () => {
    env.GITHUB_DISPATCH_TOKEN = undefined

    await triggerBookRebuild()

    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('skips without a repo', async () => {
    env.GITHUB_REPO = undefined

    await triggerBookRebuild()

    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('sends the repository_dispatch payload', async () => {
    await triggerBookRebuild()

    expect(fetchMock).toHaveBeenCalledTimes(1)
    const [url, init] = fetchMock.mock.calls[0] ?? []
    expect(url).toBe('https://api.github.com/repos/owner/repo/dispatches')
    expect(init?.method).toBe('POST')
    expect(init?.headers).toMatchObject({ Authorization: 'Bearer token-1' })
    expect(JSON.parse(String(init?.body))).toEqual({
      event_type: BOOK_REBUILD_EVENT,
    })
  })

  it('sends one dispatch for a quick burst', async () => {
    await triggerBookRebuild()
    await triggerBookRebuild()

    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('does not throw when fetch rejects', async () => {
    fetchMock.mockRejectedValue(new Error('network down'))

    await expect(triggerBookRebuild()).resolves.toBeUndefined()
  })

  it('does not throw on an error response and allows a retry', async () => {
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 403 }))

    await expect(triggerBookRebuild()).resolves.toBeUndefined()
    await triggerBookRebuild()

    expect(fetchMock).toHaveBeenCalledTimes(2)
  })
})
