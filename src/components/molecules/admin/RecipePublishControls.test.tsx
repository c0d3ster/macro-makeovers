import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { RecipePublishControls } from './RecipePublishControls'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}))
vi.mock('@/apiClients', () => ({ useSetRecipeStatus: () => vi.fn() }))

describe('RecipePublishControls', () => {
  it('shows a draft with a Publish button and no live link', () => {
    render(
      <RecipePublishControls id='recipe-1' slug='test-chili' status='draft' />
    )

    expect(screen.getByText('Draft')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Publish' })).toBeInTheDocument()
    expect(
      screen.queryByRole('link', { name: 'View live' })
    ).not.toBeInTheDocument()
  })

  it('shows a published recipe with Unpublish and a link to the live page', () => {
    render(
      <RecipePublishControls
        id='recipe-1'
        slug='test-chili'
        status='published'
      />
    )

    expect(screen.getByText('Published')).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Unpublish' })
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'View live' })).toHaveAttribute(
      'href',
      '/recipes/test-chili'
    )
  })

  it('links a draft to its preview instead of a live page', () => {
    render(
      <RecipePublishControls id='recipe-1' slug='test-chili' status='draft' />
    )

    expect(screen.getByRole('link', { name: 'Preview' })).toHaveAttribute(
      'href',
      '/admin/recipes/recipe-1/preview'
    )
  })

  it('keeps the status last, after every action', () => {
    const { container } = render(
      <RecipePublishControls id='recipe-1' slug='test-chili' status='published'>
        <button type='button'>Delete</button>
      </RecipePublishControls>
    )

    expect(container.firstElementChild?.lastElementChild).toHaveTextContent(
      'Published'
    )
  })
})
