import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { CleanPageTemplate } from './CleanPageTemplate'

describe('CleanPageTemplate', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    cleanup()
  })

  afterEach(() => {
    cleanup()
  })

  it('renders children correctly', () => {
    const testContent = 'Test page content'
    render(
      <CleanPageTemplate title='Test Page' subtitle='Test subtitle'>
        <div>{testContent}</div>
      </CleanPageTemplate>
    )

    expect(screen.getByText(testContent)).toBeInTheDocument()
  })

  it('renders title and subtitle', () => {
    render(
      <CleanPageTemplate title='Test Page' subtitle='Test subtitle'>
        <div>content</div>
      </CleanPageTemplate>
    )

    expect(screen.getByText('Test Page')).toBeInTheDocument()
    expect(screen.getByText('Test subtitle')).toBeInTheDocument()
  })

  it('renders optional header when provided', () => {
    const headerContent = 'Header content'
    render(
      <CleanPageTemplate
        title='Test Page'
        subtitle='Test subtitle'
        header={<div>{headerContent}</div>}
      >
        <div>content</div>
      </CleanPageTemplate>
    )

    expect(screen.getByText(headerContent)).toBeInTheDocument()
  })

  it('handles missing header gracefully', () => {
    render(
      <CleanPageTemplate title='Test Page' subtitle='Test subtitle'>
        <div>content</div>
      </CleanPageTemplate>
    )

    expect(screen.getByText('Test Page')).toBeInTheDocument()
    expect(screen.getByText('Test subtitle')).toBeInTheDocument()
    expect(screen.getByText('content')).toBeInTheDocument()
  })

  it('handles multiple children', () => {
    render(
      <CleanPageTemplate title='Test Page' subtitle='Test subtitle'>
        <div>First child</div>
        <div>Second child</div>
        <span>Third child</span>
      </CleanPageTemplate>
    )

    expect(screen.getByText('First child')).toBeInTheDocument()
    expect(screen.getByText('Second child')).toBeInTheDocument()
    expect(screen.getByText('Third child')).toBeInTheDocument()
  })

  it('handles React fragments as children', () => {
    render(
      <CleanPageTemplate title='Test Page' subtitle='Test subtitle'>
        <>
          <div>Fragment child 1</div>
          <div>Fragment child 2</div>
        </>
      </CleanPageTemplate>
    )

    expect(screen.getByText('Fragment child 1')).toBeInTheDocument()
    expect(screen.getByText('Fragment child 2')).toBeInTheDocument()
  })

  it('handles complex nested content', () => {
    render(
      <CleanPageTemplate title='Page Title' subtitle='Page subtitle'>
        <header>
          <h1>Content Title</h1>
          <nav>
            <a href='#link1'>Link 1</a>
            <a href='#link2'>Link 2</a>
          </nav>
        </header>
        <main>
          <section>
            <h2>Section Title</h2>
            <p>Section content</p>
          </section>
        </main>
        <footer>Footer content</footer>
      </CleanPageTemplate>
    )

    expect(screen.getByText('Page Title')).toBeInTheDocument()
    expect(screen.getByText('Page subtitle')).toBeInTheDocument()
    expect(screen.getByRole('banner')).toBeInTheDocument()
    expect(screen.getByRole('main')).toBeInTheDocument()
    expect(screen.getByRole('contentinfo')).toBeInTheDocument()
    expect(screen.getByText('Content Title')).toBeInTheDocument()
    expect(screen.getByText('Section Title')).toBeInTheDocument()
    expect(screen.getByText('Footer content')).toBeInTheDocument()
  })

  it('handles empty children gracefully', () => {
    render(
      <CleanPageTemplate title='Empty Page' subtitle='No content'>
        {null}
      </CleanPageTemplate>
    )

    // Should render the template structure even with no content
    const container = document.querySelector('.min-h-screen.bg-background')

    expect(container).toBeInTheDocument()
    expect(screen.getByText('Empty Page')).toBeInTheDocument()
    expect(screen.getByText('No content')).toBeInTheDocument()
  })

  it('handles string children', () => {
    render(
      <CleanPageTemplate title='String Page' subtitle='String content'>
        Simple string content
      </CleanPageTemplate>
    )

    expect(screen.getByText('Simple string content')).toBeInTheDocument()
  })
})
