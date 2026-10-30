import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { sampleRecipe } from '@/tests/fixtures/recipe'

import { RecipeForm } from './RecipeForm'

vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn() }) }))

describe('RecipeForm', () => {
  it('saves the edited recipe and shows the result', async () => {
    const action = vi.fn().mockResolvedValue({
      ok: true,
      id: 'recipe-1',
      slug: sampleRecipe.slug,
      summary: 'Saved.',
    })
    render(
      <RecipeForm recipeId='recipe-1' initial={sampleRecipe} action={action} />
    )

    fireEvent.change(screen.getByLabelText('Title'), {
      target: { value: 'A better title' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))

    await waitFor(() => expect(action).toHaveBeenCalled())

    expect(action).toHaveBeenCalledWith(
      'recipe-1',
      expect.objectContaining({ title: 'A better title' })
    )
    expect(await screen.findByRole('status')).toHaveTextContent('Saved.')
  })

  it('locks the slug when editing', () => {
    render(
      <RecipeForm
        recipeId='recipe-1'
        initial={sampleRecipe}
        action={vi.fn()}
      />
    )

    expect(screen.getByLabelText('Slug')).toHaveAttribute('readonly')
  })

  it('blocks a save with an empty title and does not call the action', async () => {
    const action = vi.fn()
    render(<RecipeForm initial={sampleRecipe} action={action} />)

    fireEvent.change(screen.getByLabelText('Title'), { target: { value: '' } })
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))

    expect(await screen.findAllByRole('alert')).not.toHaveLength(0)
    expect(action).not.toHaveBeenCalled()
  })
})
