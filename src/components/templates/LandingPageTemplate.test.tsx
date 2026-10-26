import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { LandingPageTemplate } from './LandingPageTemplate'

// Mock child components
vi.mock('@/components/organisms', () => ({
  __esModule: true,
  SiteHeader: ({
    menuItems,
  }: {
    menuItems: Array<{ label: string; href: string }>
  }) => (
    <header data-testid='site-header'>
      {menuItems.map((item) => (
        <a
          key={item.label}
          href={item.href}
          data-testid={`nav-${item.label.toLowerCase()}`}
        >
          {item.label}
        </a>
      ))}
    </header>
  ),
}))

describe('LandingPageTemplate', () => {
  it('renders children correctly', () => {
    const testContent = 'Test landing page content'
    render(
      <LandingPageTemplate>
        <div>{testContent}</div>
      </LandingPageTemplate>
    )

    expect(screen.getByText(testContent)).toBeInTheDocument()
  })

  it('renders SiteHeader component', () => {
    render(
      <LandingPageTemplate>
        <div>content</div>
      </LandingPageTemplate>
    )

    expect(screen.getByTestId('site-header')).toBeInTheDocument()
  })

  it('renders navigation menu items', () => {
    render(
      <LandingPageTemplate>
        <div>content</div>
      </LandingPageTemplate>
    )

    expect(screen.getByTestId('nav-home')).toBeInTheDocument()
    expect(screen.getByTestId('nav-contact')).toBeInTheDocument()
  })

  it('renders SiteHeader before content', () => {
    render(
      <LandingPageTemplate>
        <div data-testid='test-content'>content</div>
      </LandingPageTemplate>
    )

    const header = screen.getByTestId('site-header')
    const content = screen.getByTestId('test-content')

    // SiteHeader should be rendered before the content in the DOM
    expect(header.compareDocumentPosition(content)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING
    )
  })

  it('handles multiple children', () => {
    render(
      <LandingPageTemplate>
        <div>Header content</div>
        <main>Main content</main>
        <footer>Footer content</footer>
      </LandingPageTemplate>
    )

    expect(screen.getByText('Header content')).toBeInTheDocument()
    expect(screen.getByRole('main')).toBeInTheDocument()
    expect(screen.getByRole('contentinfo')).toBeInTheDocument()
  })

  it('handles React fragments as children', () => {
    render(
      <LandingPageTemplate>
        <>
          <div>Fragment child 1</div>
          <div>Fragment child 2</div>
        </>
      </LandingPageTemplate>
    )

    expect(screen.getByText('Fragment child 1')).toBeInTheDocument()
    expect(screen.getByText('Fragment child 2')).toBeInTheDocument()
  })

  it('handles complex landing page structure', () => {
    render(
      <LandingPageTemplate>
        <section data-testid='hero'>Hero Section</section>
        <section data-testid='portfolio'>Portfolio Section</section>
        <section data-testid='contact'>Contact Section</section>
      </LandingPageTemplate>
    )

    expect(screen.getByTestId('site-header')).toBeInTheDocument()
    expect(screen.getByTestId('hero')).toBeInTheDocument()
    expect(screen.getByTestId('portfolio')).toBeInTheDocument()
    expect(screen.getByTestId('contact')).toBeInTheDocument()
  })

  it('handles empty children gracefully', () => {
    render(<LandingPageTemplate>{null}</LandingPageTemplate>)

    // Should still render SiteHeader and container structure
    expect(screen.getByTestId('site-header')).toBeInTheDocument()

    const container = document.querySelector(
      '.min-h-screen.scroll-smooth.bg-background'
    )

    expect(container).toBeInTheDocument()
  })

  it('handles string children', () => {
    render(<LandingPageTemplate>Simple string content</LandingPageTemplate>)

    expect(screen.getByText('Simple string content')).toBeInTheDocument()
    expect(screen.getByTestId('site-header')).toBeInTheDocument()
  })

  it('ensures header and content coexist', () => {
    render(
      <LandingPageTemplate>
        <div data-testid='content'>Landing content</div>
      </LandingPageTemplate>
    )

    // Both header and content should be present
    expect(screen.getByTestId('site-header')).toBeInTheDocument()
    expect(screen.getByTestId('content')).toBeInTheDocument()
  })

  it('maintains template structure with dynamic content', () => {
    const { rerender } = render(
      <LandingPageTemplate>
        <div>Initial content</div>
      </LandingPageTemplate>
    )

    expect(screen.getByText('Initial content')).toBeInTheDocument()
    expect(screen.getByTestId('site-header')).toBeInTheDocument()

    rerender(
      <LandingPageTemplate>
        <div>Updated content</div>
      </LandingPageTemplate>
    )

    expect(screen.getByText('Updated content')).toBeInTheDocument()
    expect(screen.getByTestId('site-header')).toBeInTheDocument()
  })

  it('applies correct CSS classes to container', () => {
    render(
      <LandingPageTemplate>
        <div>content</div>
      </LandingPageTemplate>
    )

    const container = document.querySelector(
      '.min-h-screen.scroll-smooth.bg-background'
    )

    expect(container).toBeInTheDocument()
  })

  it('applies correct padding to content area', () => {
    render(
      <LandingPageTemplate>
        <div data-testid='content'>content</div>
      </LandingPageTemplate>
    )

    const contentArea = document.querySelector('.pt-16')

    expect(contentArea).toBeInTheDocument()
    expect(screen.getByTestId('content')).toBeInTheDocument()
  })
})
