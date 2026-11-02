import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { RecipePublishButton } from './RecipePublishButton'

const mocks = vi.hoisted(() => ({
  setRecipeStatus: vi.fn(),
  refresh: vi.fn(),
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: mocks.refresh }),
}))
vi.mock('@/apiClients', () => ({
  useSetRecipeStatus: () => mocks.setRecipeStatus,
}))

describe('RecipePublishButton', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.setRecipeStatus.mockResolvedValue(undefined)
  })

  it('publishes a draft and refreshes the page', async () => {
    render(<RecipePublishButton id='recipe-1' status='draft' />)

    fireEvent.click(screen.getByRole('button', { name: 'Publish' }))

    await waitFor(() => expect(mocks.refresh).toHaveBeenCalled())

    expect(mocks.setRecipeStatus).toHaveBeenCalledWith('recipe-1', 'published')
  })

  it('unpublishes a published recipe', async () => {
    render(<RecipePublishButton id='recipe-1' status='published' />)

    fireEvent.click(screen.getByRole('button', { name: 'Unpublish' }))

    await waitFor(() => expect(mocks.refresh).toHaveBeenCalled())

    expect(mocks.setRecipeStatus).toHaveBeenCalledWith('recipe-1', 'draft')
  })

  it('shows the server message and does not refresh when the change fails', async () => {
    mocks.setRecipeStatus.mockRejectedValue(
      new Error('Only the site owner can publish recipes.')
    )
    render(<RecipePublishButton id='recipe-1' status='draft' />)

    fireEvent.click(screen.getByRole('button', { name: 'Publish' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Only the site owner can publish recipes.'
    )
    expect(mocks.refresh).not.toHaveBeenCalled()
  })
})
