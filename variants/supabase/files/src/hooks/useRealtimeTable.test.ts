import { renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useRealtimeTable } from './useRealtimeTable'

const { channel, removeChannel } = vi.hoisted(() => {
  const builder = { on: vi.fn(), subscribe: vi.fn() }
  builder.on.mockReturnValue(builder)
  builder.subscribe.mockReturnValue(builder)
  return { channel: vi.fn(() => builder), removeChannel: vi.fn() }
})

vi.mock('@/libs/supabase/client', () => ({
  createClient: (): { channel: typeof channel; removeChannel: typeof removeChannel } => ({
    channel,
    removeChannel,
  }),
  isSupabaseConfigured: (): boolean => true,
}))

describe('useRealtimeTable', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('gives each instance its own channel, even for the same table and filter', () => {
    renderHook(() => useRealtimeTable({ table: 'messages', onChange: vi.fn() }))
    renderHook(() => useRealtimeTable({ table: 'messages', onChange: vi.fn() }))

    const names = (channel.mock.calls as unknown as string[][]).map(([name]) => name)

    expect(names).toHaveLength(2)
    expect(new Set(names).size).toBe(2)
  })

  it('removes its channel on unmount', () => {
    const { unmount } = renderHook(() => useRealtimeTable({ table: 'messages', onChange: vi.fn() }))

    unmount()

    expect(removeChannel).toHaveBeenCalledTimes(1)
  })
})
