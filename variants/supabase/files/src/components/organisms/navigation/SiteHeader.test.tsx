import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { NavItem } from './SiteHeader'

import { SiteHeader } from './SiteHeader'

// Mock next/navigation
vi.mock('next/navigation', () => ({
  usePathname: vi.fn(() => '/'),
}))

// Mock next/image
vi.mock('next/image', () => ({
  default: vi.fn(),
}))

// #region @module:auth
// Mock auth
vi.mock('@/providers', () => ({
  useAuth: vi.fn(() => ({
    user: null,
    isLoaded: true,
    signOut: vi.fn(),
  })),
}))
// #endregion @module:auth

// Mock window properties to prevent hanging
Object.defineProperty(window, 'scrollY', { value: 0, writable: true })

// Menu items matching the actual template
const sampleMenuItems: NavItem[] = [
  { id: 'home', label: 'Home', href: '/' },
  { id: 'contact', label: 'Contact', href: '/#contact' },
]

describe('SiteHeader', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    cleanup()
  })

  afterEach(() => {
    cleanup()
  })

  it('renders header element', () => {
    render(<SiteHeader menuItems={sampleMenuItems} />)

    const header = screen.getByRole('banner')

    expect(header).toBeInTheDocument()
  })

  it('renders logo text', () => {
    render(<SiteHeader menuItems={sampleMenuItems} />)

    const logo = screen.getByText('LOGO')

    expect(logo).toBeInTheDocument()
  })

  it('renders navigation menu items', () => {
    render(<SiteHeader menuItems={sampleMenuItems} />)

    expect(screen.getByText('Home')).toBeInTheDocument()
    expect(screen.getByText('Contact')).toBeInTheDocument()
  })

  // #region @module:auth
  it('renders Sign In button when user is not logged in', () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'http://localhost:54321')
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY', 'sb_publishable_stub')
    render(<SiteHeader menuItems={sampleMenuItems} />)

    expect(screen.getByText('Sign In')).toBeInTheDocument()

    vi.unstubAllEnvs()
  })
  // #endregion @module:auth

  it('renders correct href attributes for menu items', () => {
    render(<SiteHeader menuItems={sampleMenuItems} />)

    const homeLink = screen.getByText('Home').closest('a')
    const contactLink = screen.getByText('Contact').closest('a')

    expect(homeLink).toHaveAttribute('href', '/')
    expect(contactLink).toHaveAttribute('href', '/#contact')
  })

  it('applies correct styling classes to menu items', () => {
    render(<SiteHeader menuItems={sampleMenuItems} />)

    const homeLink = screen.getByText('Home').closest('a')

    expect(homeLink).toHaveClass('text-sm', 'font-medium', 'transition-colors')
  })

  it('renders without errors when no menu items provided', () => {
    render(<SiteHeader menuItems={[]} />)

    const header = screen.getByRole('banner')

    expect(header).toBeInTheDocument()
  })
})
