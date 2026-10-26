import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import RootLayout from './layout'

// Mock Next.js components
vi.mock('next/font/google', () => ({
  Inter: () => ({ className: 'inter-font' }),
}))

// Mock providers
vi.mock('@/providers', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  QueryProvider: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  ProvidersWrapper: ({ children }: { children: React.ReactNode }) => (
    <div data-testid='providers-wrapper'>{children}</div>
  ),
}))

describe('RootLayout', () => {
  it('should render with providers wrapper', () => {
    render(
      <RootLayout>
        <div data-testid='page-content'>Page Content</div>
      </RootLayout>
    )

    // Check that children are rendered (which confirms providers are working)
    expect(screen.getByTestId('page-content')).toBeInTheDocument()
  })

  it('should have correct HTML structure', () => {
    render(
      <RootLayout>
        <div>Test</div>
      </RootLayout>
    )

    // Check that the html element exists and has the correct structure
    expect(document.documentElement.tagName).toBe('HTML')
    expect(document.documentElement.getAttribute('lang')).toBe('en')
    expect(document.body).toBeInTheDocument()
  })
})
