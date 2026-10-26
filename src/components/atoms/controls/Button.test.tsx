import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { Button } from './Button'

describe('Button', () => {
  it('renders as a button by default', () => {
    render(<Button>Click me</Button>)

    const button = screen.getByRole('button', { name: 'Click me' })

    expect(button).toBeInTheDocument()
    expect(button.tagName).toBe('BUTTON')
  })

  it('renders with correct default styling', () => {
    render(<Button>Click me</Button>)

    const button = screen.getByRole('button')

    expect(button).toHaveClass(
      'inline-block',
      'rounded',
      'font-medium',
      'transition-all',
      'duration-300',
      'disabled:cursor-not-allowed',
      'disabled:opacity-50',
      'focus:ring-2',
      'focus:ring-primary/50',
      'bg-primary',
      'text-text',
      'hover:bg-primary/90',
      'px-6',
      'py-3',
      'text-base'
    )
  })

  it('renders with small size', () => {
    render(<Button size='sm'>Small Button</Button>)

    const button = screen.getByRole('button')

    expect(button).toHaveClass('px-4 py-2 text-sm')
  })

  it('renders with large size', () => {
    render(<Button size='lg'>Large Button</Button>)

    const button = screen.getByRole('button')

    expect(button).toHaveClass('px-8 py-4 text-lg')
  })

  it('renders as a link when href is provided', () => {
    render(<Button href='/test'>Link Button</Button>)

    const link = screen.getByRole('link', { name: 'Link Button' })

    expect(link).toBeInTheDocument()
    expect(link.tagName).toBe('A')
    expect(link).toHaveAttribute('href', '/test')
  })

  it('renders as external link when external is true', () => {
    render(
      <Button href='https://example.com' external>
        External Link
      </Button>
    )

    const link = screen.getByRole('link')

    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', 'noopener noreferrer')
  })

  it('renders as submit button when type is submit', () => {
    render(<Button type='submit'>Submit</Button>)

    const button = screen.getByRole('button')

    expect(button).toHaveAttribute('type', 'submit')
  })

  it('handles click events', () => {
    const handleClick = vi.fn()
    render(<Button onClick={handleClick}>Click me</Button>)

    const button = screen.getByRole('button')
    fireEvent.click(button)

    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('applies custom className', () => {
    render(<Button className='bg-blue-500'>Custom Button</Button>)

    const button = screen.getByRole('button')

    expect(button).toHaveClass('bg-blue-500')
  })

  it('renders disabled state', () => {
    render(<Button disabled>Disabled Button</Button>)

    const button = screen.getByRole('button')

    expect(button).toBeDisabled()
    expect(button).toHaveClass(
      'disabled:cursor-not-allowed disabled:opacity-50'
    )
  })

  it('renders children correctly', () => {
    render(
      <Button>
        <span>Complex</span> <strong>Content</strong>
      </Button>
    )

    expect(screen.getByText('Complex')).toBeInTheDocument()
    expect(screen.getByText('Content')).toBeInTheDocument()
  })

  it('forwards additional props to button element', () => {
    render(
      <Button data-testid='test-button' aria-label='Test button'>
        Test
      </Button>
    )

    const button = screen.getByTestId('test-button')

    expect(button).toHaveAttribute('aria-label', 'Test button')
  })

  it('forwards additional props to link element', () => {
    render(
      <Button href='/test' data-testid='test-link' aria-label='Test link'>
        Test
      </Button>
    )

    const link = screen.getByTestId('test-link')

    expect(link).toHaveAttribute('aria-label', 'Test link')
  })
})
