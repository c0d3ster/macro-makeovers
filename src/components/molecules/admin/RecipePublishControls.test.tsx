import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { RecipePublishControls } from './RecipePublishControls'

const action = vi.fn()

const hiddenValue = (name: string): string | undefined =>
  (
    document.querySelector(`input[name="${name}"]`) as HTMLInputElement | null
  )?.value

describe('RecipePublishControls', () => {
  it('shows a draft with a Publish button that asks for published', () => {
    render(
      <RecipePublishControls
        id='recipe-1'
        slug='test-chili'
        status='draft'
        action={action}
      />
    )

    expect(screen.getByText('Draft')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Publish' })).toBeInTheDocument()
    expect(hiddenValue('id')).toBe('recipe-1')
    expect(hiddenValue('status')).toBe('published')
    expect(screen.queryByRole('link', { name: 'View live' })).not.toBeInTheDocument()
  })

  it('shows a published recipe with Unpublish and a link to the live page', () => {
    render(
      <RecipePublishControls
        id='recipe-1'
        slug='test-chili'
        status='published'
        action={action}
      />
    )

    expect(screen.getByText('Published')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Unpublish' })).toBeInTheDocument()
    expect(hiddenValue('status')).toBe('draft')
    expect(screen.getByRole('link', { name: 'View live' })).toHaveAttribute(
      'href',
      '/recipes/test-chili'
    )
  })
})
