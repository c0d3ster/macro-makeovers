// @vitest-environment node
import { NextRequest, NextResponse } from 'next/server'
import { afterEach, describe, expect, it, vi } from 'vitest'

import proxy, { config } from './proxy'

const updateSession = vi.hoisted(() => vi.fn())

vi.mock('@/libs/supabase/proxy', () => ({ updateSession }))

// Next compiles `matcher` with path-to-regexp; anchoring it like this is close enough to check it
const matches = (path: string): boolean => new RegExp(`^${config.matcher}$`).test(path)

const configure = (): void => {
  vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'http://127.0.0.1:54321')
  vi.stubEnv('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY', 'sb_publishable_test')
}

afterEach(() => {
  vi.unstubAllEnvs()
  updateSession.mockReset()
})

describe('proxy matcher', () => {
  it('runs on pages and API routes', () => {
    ;['/', '/profile', '/profile/settings', '/login', '/api/graphql'].forEach((path) => {
      expect(matches(path)).toBe(true)
    })
  })

  it('skips Next internals and static files', () => {
    ;['/_next/static/chunk.js', '/_vercel/insights', '/favicon.ico', '/robots.txt'].forEach((path) => {
      expect(matches(path)).toBe(false)
    })
  })
})

describe('proxy', () => {
  it('lets every request through when Supabase is not configured', async () => {
    // A developer's .env.local is loaded by Vitest, so unset the variables explicitly
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', '')
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY', '')

    const response = await proxy(new NextRequest('http://localhost:3000/profile'))

    expect(response.status).toBe(200)
    expect(updateSession).not.toHaveBeenCalled()
  })

  it('redirects a signed-out visitor from /profile to /login, remembering where they were going', async () => {
    configure()
    updateSession.mockResolvedValue({ response: NextResponse.next(), authId: undefined })

    const response = await proxy(new NextRequest('http://localhost:3000/profile?tab=1'))

    expect(response.status).toBe(307)
    expect(response.headers.get('location')).toBe('http://localhost:3000/login?next=%2Fprofile%3Ftab%3D1')
  })

  it('lets a signed-in user reach /profile', async () => {
    configure()
    updateSession.mockResolvedValue({ response: NextResponse.next(), authId: 'user-1' })

    const response = await proxy(new NextRequest('http://localhost:3000/profile'))

    expect(response.status).toBe(200)
  })

  it('leaves public pages alone for signed-out visitors', async () => {
    configure()
    updateSession.mockResolvedValue({ response: NextResponse.next(), authId: undefined })

    const response = await proxy(new NextRequest('http://localhost:3000/'))

    expect(response.status).toBe(200)
  })
})
