import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { QueryProvider } from './QueryProvider'

// Mock TanStack Query
vi.mock('@tanstack/react-query', () => ({
  QueryClient: vi.fn(() => ({
    invalidateQueries: vi.fn(),
    setQueryData: vi.fn(),
    getQueryData: vi.fn(),
  })),
  QueryClientProvider: vi.fn(({ children }) => children),
}))

describe('QueryProvider', () => {
  it('should render children', () => {
    render(
      <QueryProvider>
        <div data-testid='child'>Test Child</div>
      </QueryProvider>
    )

    expect(screen.getByTestId('child')).toBeInTheDocument()
  })

  it('should render without crashing', () => {
    render(
      <QueryProvider>
        <div>Test</div>
      </QueryProvider>
    )

    // Just verify it renders without errors
    expect(screen.getByText('Test')).toBeInTheDocument()
  })
})
