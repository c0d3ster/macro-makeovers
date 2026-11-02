import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { sampleRecipe } from '@/tests/fixtures/recipe'

import { RecipeForm } from './RecipeForm'

vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn() }) }))

// The form saves through useSaveRecipe, which wraps the importRecipe mutation
const mockSave = vi.fn()
vi.mock('@/apiClients', async () => ({
  ...(await vi.importActual('@/apiClients')),
  useSaveRecipe: () => mockSave,
}))

describe('RecipeForm', () => {
  beforeEach(() => vi.clearAllMocks())

  it('saves the edited recipe and shows the result', async () => {
    mockSave.mockResolvedValue({
      ok: true,
      id: 'recipe-1',
      slug: sampleRecipe.slug,
      summary: 'Saved.',
    })
    render(<RecipeForm recipeId='recipe-1' initial={sampleRecipe} />)

    fireEvent.change(screen.getByLabelText('Title'), {
      target: { value: 'A better title' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))

    await waitFor(() => expect(mockSave).toHaveBeenCalled())

    expect(mockSave).toHaveBeenCalledWith(
      'recipe-1',
      expect.objectContaining({ title: 'A better title' })
    )
    expect(await screen.findByRole('status')).toHaveTextContent('Saved.')
  })

  it('locks the slug when editing', () => {
    render(<RecipeForm recipeId='recipe-1' initial={sampleRecipe} />)

    expect(screen.getByLabelText('Slug')).toHaveAttribute('readonly')
  })

  it('links to the preview of the saved recipe only when editing', () => {
    const { rerender } = render(
      <RecipeForm recipeId='recipe-1' initial={sampleRecipe} />
    )

    expect(
      screen.getByRole('link', { name: 'Preview saved version' })
    ).toHaveAttribute('href', '/admin/recipes/recipe-1/preview')

    rerender(<RecipeForm initial={sampleRecipe} />)

    expect(
      screen.queryByRole('link', { name: 'Preview saved version' })
    ).not.toBeInTheDocument()
  })

  it('blocks a save with an empty title and does not call the mutation', async () => {
    render(<RecipeForm initial={sampleRecipe} />)

    fireEvent.change(screen.getByLabelText('Title'), { target: { value: '' } })
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))

    expect(await screen.findAllByRole('alert')).not.toHaveLength(0)
    expect(mockSave).not.toHaveBeenCalled()
  })
})
