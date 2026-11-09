import type { User } from '@supabase/supabase-js'

import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { Env } from '@/libs/Env'
import { useAuth, useOwnerStatus } from '@/providers'

import type { NavItem } from './SiteHeader'

import { SiteHeader } from './SiteHeader'

// Mock next/navigation
vi.mock('next/navigation', () => ({
  usePathname: vi.fn(() => '/'),
}))

// Mock auth
vi.mock('@/providers', () => ({
  useAuth: vi.fn(() => ({
    user: null,
    isLoaded: true,
    signOut: vi.fn(),
  })),
  useOwnerStatus: vi.fn((): 'pending' | 'owner' | 'visitor' => 'visitor'),
  useBasket: vi.fn(() => ({
    entries: [{ slug: 'a', batches: 1 }],
    isLoaded: true,
  })),
}))

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
    vi.mocked(useAuth).mockReturnValue({
      user: null,
      isLoaded: true,
      signOut: vi.fn(),
    })
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

  it('shows the brand name beside the logo mark', () => {
    render(<SiteHeader menuItems={sampleMenuItems} />)

    expect(screen.getByText(Env.NEXT_PUBLIC_BRAND_NAME)).toBeInTheDocument()
    expect(screen.getByTestId('next-image')).toHaveAttribute(
      'data-src',
      '/logo.png'
    )
  })

  it('renders navigation menu items', () => {
    render(<SiteHeader menuItems={sampleMenuItems} />)

    expect(screen.getByText('Home')).toBeInTheDocument()
    expect(screen.getByText('Contact')).toBeInTheDocument()
  })

  it('shows the account menu instead of Sign In when signed in', () => {
    vi.mocked(useAuth).mockReturnValue({
      user: { id: 'user-1' } as User,
      isLoaded: true,
      signOut: vi.fn(),
    })
    render(<SiteHeader menuItems={sampleMenuItems} />)

    expect(
      screen.getByRole('button', { name: 'Account menu' })
    ).toBeInTheDocument()
    expect(screen.queryByText('Sign In')).not.toBeInTheDocument()
  })

  it('renders Sign In button when user is not logged in', () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'http://localhost:54321')
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY', 'sb_publishable_stub')
    render(<SiteHeader menuItems={sampleMenuItems} />)

    expect(screen.getByText('Sign In')).toBeInTheDocument()

    vi.unstubAllEnvs()
  })

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

  it('shows owner-only links to the owner only', () => {
    const items: NavItem[] = [
      ...sampleMenuItems,
      {
        id: 'manage',
        label: 'Manage recipes',
        href: '/admin',
        ownerOnly: true,
      },
    ]
    const { rerender } = render(<SiteHeader menuItems={items} />)

    expect(
      screen.queryByRole('link', { name: 'Manage recipes' })
    ).not.toBeInTheDocument()

    vi.mocked(useOwnerStatus).mockReturnValue('owner')
    rerender(<SiteHeader menuItems={items} activeItem='manage' />)

    expect(
      screen.getByRole('link', { name: 'Manage recipes' })
    ).toHaveAttribute('href', '/admin')
  })

  it('keeps the nav out of sight while the owner check is pending', () => {
    vi.mocked(useOwnerStatus).mockReturnValue('pending')
    render(
      <SiteHeader
        menuItems={[
          ...sampleMenuItems,
          {
            id: 'manage',
            label: 'Manage recipes',
            href: '/admin',
            ownerOnly: true,
          },
        ]}
      />
    )

    // The links take up their space but cannot be seen, reached or read out
    expect(
      screen.queryByRole('link', { name: 'Manage recipes' })
    ).not.toBeInTheDocument()
    expect(screen.getByText('Manage recipes').closest('nav')).toHaveClass(
      'opacity-0'
    )

    vi.mocked(useOwnerStatus).mockReturnValue('visitor')
  })

  it('does not hide the nav of a header with no owner-only links', () => {
    vi.mocked(useOwnerStatus).mockReturnValue('pending')
    render(<SiteHeader menuItems={sampleMenuItems} />)

    expect(screen.getByRole('link', { name: 'Home' })).toBeInTheDocument()
  })

  it('shows sub-pages in a menu', () => {
    render(
      <SiteHeader
        menuItems={[
          {
            id: 'guides',
            label: 'Guides',
            href: '/guides',
            children: [{ label: 'Nutrition guide', href: '/guides/nutrition' }],
          },
        ]}
      />
    )

    const trigger = screen.getByRole('button', { name: 'Guides' })

    expect(trigger).toHaveAttribute('aria-expanded', 'false')

    fireEvent.click(trigger)

    expect(trigger).toHaveAttribute('aria-expanded', 'true')
    expect(
      screen.getByRole('menuitem', { name: 'All guides' })
    ).toHaveAttribute('href', '/guides')
    expect(
      screen.getByRole('menuitem', { name: 'Nutrition guide' })
    ).toHaveAttribute('href', '/guides/nutrition')

    fireEvent.keyDown(screen.getByRole('menu'), { key: 'Escape' })

    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
  })

  it('drops the links and sub-pages down from the phone menu button', () => {
    render(
      <SiteHeader
        menuItems={[
          ...sampleMenuItems,
          {
            id: 'guides',
            label: 'Guides',
            href: '/guides',
            children: [{ label: 'Nutrition guide', href: '/guides/nutrition' }],
          },
        ]}
        activeItem='home'
      />
    )

    const trigger = screen.getByRole('button', { name: 'Menu' })

    expect(trigger).toHaveAttribute('aria-expanded', 'false')

    fireEvent.click(trigger)

    const panel = screen.getByRole('navigation', { name: 'Site' })

    expect(trigger).toHaveAttribute('aria-expanded', 'true')
    expect(within(panel).getByRole('link', { name: 'Home' })).toHaveAttribute(
      'aria-current',
      'page'
    )
    expect(
      within(panel).getByRole('link', { name: 'Nutrition guide' })
    ).toHaveAttribute('href', '/guides/nutrition')

    fireEvent.click(within(panel).getByRole('link', { name: 'Contact' }))

    expect(
      screen.queryByRole('navigation', { name: 'Site' })
    ).not.toBeInTheDocument()

    fireEvent.click(trigger)
    fireEvent.keyDown(document, { key: 'Escape' })

    expect(trigger).toHaveAttribute('aria-expanded', 'false')
  })

  it('leaves owner-only links out of the phone menu until the owner is confirmed', () => {
    vi.mocked(useOwnerStatus).mockReturnValue('pending')
    render(
      <SiteHeader
        menuItems={[
          ...sampleMenuItems,
          {
            id: 'manage',
            label: 'Manage recipes',
            href: '/admin',
            ownerOnly: true,
          },
        ]}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: 'Menu' }))

    expect(
      within(screen.getByRole('navigation', { name: 'Site' })).queryByText(
        'Manage recipes'
      )
    ).not.toBeInTheDocument()

    vi.mocked(useOwnerStatus).mockReturnValue('visitor')
  })

  it('renders without errors when no menu items provided', () => {
    render(<SiteHeader menuItems={[]} />)

    const header = screen.getByRole('banner')

    expect(header).toBeInTheDocument()
  })
})
