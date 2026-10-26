import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { ClerkProvider } from './ClerkProvider'

// Mock Clerk
vi.mock('@clerk/nextjs', () => ({
  ClerkProvider: vi.fn(({ children }) => children),
}))

describe('ClerkProvider', () => {
  it('should render children', () => {
    render(
      <ClerkProvider>
        <div data-testid='child'>Test Child</div>
      </ClerkProvider>
    )

    expect(screen.getByTestId('child')).toBeInTheDocument()
  })

  it('should render without crashing', () => {
    render(
      <ClerkProvider>
        <div>Test</div>
      </ClerkProvider>
    )

    // Just verify it renders without errors
    expect(screen.getByText('Test')).toBeInTheDocument()
  })
})
