import type { HandoffLine } from './groceryTypes'

// Handoff lines for adapter tests
export const testLine = (key: string, overrides: Partial<HandoffLine> = {}): HandoffLine => ({
  key,
  name: `${key} name`,
  searchTerm: `${key} term`,
  packCount: 1,
  measures: [{ quantity: 16, unit: 'oz' }],
  display: '1 × 16 oz tub',
  ...overrides,
})

type Call = { url: string; init?: RequestInit }

// A fetch that answers from a route table and records every call
export const mockFetch = (
  route: (url: string, init?: RequestInit) => { status?: number; body?: unknown }
) => {
  const calls: Call[] = []
  const fetcher = async (url: string, init?: RequestInit): Promise<Response> => {
    calls.push({ url, ...(init ? { init } : {}) })
    const { status = 200, body } = route(url, init)
    return new Response(body === undefined ? null : JSON.stringify(body), { status })
  }
  return { fetcher, calls }
}
