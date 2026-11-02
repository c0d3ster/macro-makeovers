import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { RecipeDeleteButton } from './RecipeDeleteButton'

const mocks = vi.hoisted(() => ({
  deleteRecipe: vi.fn(),
  push: vi.fn(),
  refresh: vi.fn(),
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mocks.push, refresh: mocks.refresh }),
}))
vi.mock('@/apiClients', () => ({ useDeleteRecipe: () => mocks.deleteRecipe }))

describe('RecipeDeleteButton', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.deleteRecipe.mockResolvedValue(undefined)
  })

  it('asks first and deletes nothing on the first click', () => {
    render(<RecipeDeleteButton id='recipe-1' title='Chili' />)

    fireEvent.click(screen.getByRole('button', { name: 'Delete' }))

    expect(screen.getByText(/Delete .Chili. for good\?/)).toBeInTheDocument()
    expect(mocks.deleteRecipe).not.toHaveBeenCalled()
  })

  it('goes back to the plain button on cancel', () => {
    render(<RecipeDeleteButton id='recipe-1' title='Chili' />)

    fireEvent.click(screen.getByRole('button', { name: 'Delete' }))
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))

    expect(screen.getByRole('button', { name: 'Delete' })).toBeInTheDocument()
    expect(mocks.deleteRecipe).not.toHaveBeenCalled()
  })

  it('deletes on the second click and refreshes the page', async () => {
    render(<RecipeDeleteButton id='recipe-1' title='Chili' />)

    fireEvent.click(screen.getByRole('button', { name: 'Delete' }))
    fireEvent.click(screen.getByRole('button', { name: 'Yes, delete' }))

    await waitFor(() => expect(mocks.refresh).toHaveBeenCalled())

    expect(mocks.deleteRecipe).toHaveBeenCalledWith('recipe-1')
    expect(mocks.push).not.toHaveBeenCalled()
  })

  it('leaves for the given page after deleting', async () => {
    render(
      <RecipeDeleteButton id='recipe-1' title='Chili' redirectTo='/admin' />
    )

    fireEvent.click(screen.getByRole('button', { name: 'Delete' }))
    fireEvent.click(screen.getByRole('button', { name: 'Yes, delete' }))

    await waitFor(() => expect(mocks.push).toHaveBeenCalledWith('/admin'))
  })

  it('shows the server message and stays put when the delete is refused', async () => {
    mocks.deleteRecipe.mockRejectedValue(
      new Error('Delete or unlink its variants first: Pork Bulgogi.')
    )
    render(
      <RecipeDeleteButton id='recipe-1' title='Chili' redirectTo='/admin' />
    )

    fireEvent.click(screen.getByRole('button', { name: 'Delete' }))
    fireEvent.click(screen.getByRole('button', { name: 'Yes, delete' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Delete or unlink its variants first: Pork Bulgogi.'
    )
    expect(mocks.push).not.toHaveBeenCalled()
    expect(mocks.refresh).not.toHaveBeenCalled()
  })
})
