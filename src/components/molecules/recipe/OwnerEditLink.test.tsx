import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { OwnerEditLink } from './OwnerEditLink'

const mocks = vi.hoisted(() => ({ isOwner: vi.fn() }))

vi.mock('@/providers', () => ({ useIsOwner: () => mocks.isOwner() }))

describe('OwnerEditLink', () => {
  afterEach(cleanup)

  it('links the owner to that recipe in the editor', () => {
    mocks.isOwner.mockReturnValue(true)
    render(<OwnerEditLink recipeId='recipe-1' />)

    expect(screen.getByRole('link', { name: 'Edit recipe' })).toHaveAttribute(
      'href',
      '/admin/recipes/recipe-1/edit'
    )
  })

  it('shows nothing to anyone else', () => {
    mocks.isOwner.mockReturnValue(false)
    const { container } = render(<OwnerEditLink recipeId='recipe-1' />)

    expect(container).toBeEmptyDOMElement()
  })
})
